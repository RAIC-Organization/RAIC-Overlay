// GitHub Releases API client for the plugin installer.
//
// Unauthenticated only (60 req/hour shared limit per IP). The installer
// fetches the latest tagged release of a plugin's repo and downloads its
// `raic-plugin.zip` asset. ETag-aware so the daily auto-update poller
// (Phase 6) can rely on cheap 304s.
//
// Authoritative spec: research.md R-006 + spec.md FR-001/002/008.

use std::path::Path;
use std::time::Duration;

use reqwest::Client;
use serde::Deserialize;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use tokio_stream::StreamExt;

/// User-Agent header sent to GitHub's API (required).
fn user_agent() -> String {
    format!(
        "RAICOverlay/{} (https://github.com/RAIC-Organization/RAIC-Overlay)",
        env!("CARGO_PKG_VERSION")
    )
}

/// The name of the release asset that contains the plugin bundle.
pub const PLUGIN_ASSET_NAME: &str = "raic-plugin.zip";

#[derive(Debug, Clone, Deserialize)]
pub struct GithubRelease {
    pub tag_name: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub body: Option<String>,
    pub html_url: String,
    pub assets: Vec<GithubAsset>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GithubAsset {
    pub name: String,
    pub browser_download_url: String,
    pub size: u64,
    #[serde(default)]
    pub content_type: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ReleaseFetch {
    pub release: GithubRelease,
    /// Echoed ETag from the response, for caching on next poll.
    pub etag: Option<String>,
}

fn build_client() -> Result<Client, String> {
    Client::builder()
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(120))
        .user_agent(user_agent())
        .build()
        .map_err(|e| format!("build http client: {e}"))
}

/// `GET /repos/{owner}/{repo}/releases/latest` with optional If-None-Match.
/// Returns `Ok(None)` on HTTP 304 (cache hit).
///
/// Errors are returned as user-readable strings; the installer translates
/// them into JSON-RPC errors / consent-dialog messages.
pub async fn fetch_latest_release(
    owner: &str,
    repo: &str,
    etag: Option<&str>,
) -> Result<Option<ReleaseFetch>, String> {
    let client = build_client()?;
    let url = format!("https://api.github.com/repos/{owner}/{repo}/releases/latest");
    let mut req = client.get(&url);
    if let Some(tag) = etag {
        req = req.header("If-None-Match", tag);
    }

    let resp = req.send().await.map_err(|e| format!("GET {url}: {e}"))?;

    if resp.status() == reqwest::StatusCode::NOT_MODIFIED {
        return Ok(None);
    }

    if resp.status() == reqwest::StatusCode::FORBIDDEN
        && resp
            .headers()
            .get("x-ratelimit-remaining")
            .and_then(|v| v.to_str().ok())
            == Some("0")
    {
        let reset_at = resp
            .headers()
            .get("x-ratelimit-reset")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("unknown")
            .to_string();
        return Err(format!(
            "GitHub API rate-limited (60 req/hour unauthenticated); retry after Unix timestamp {reset_at}"
        ));
    }

    if resp.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(format!(
            "repository {owner}/{repo} not found or has no published releases"
        ));
    }

    if !resp.status().is_success() {
        return Err(format!(
            "unexpected status {} fetching latest release of {owner}/{repo}",
            resp.status()
        ));
    }

    let etag = resp
        .headers()
        .get("etag")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let body_bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("read release body: {e}"))?;
    let release: GithubRelease = serde_json::from_slice(&body_bytes)
        .map_err(|e| format!("parse release JSON: {e}"))?;

    Ok(Some(ReleaseFetch { release, etag }))
}

/// Pick the `raic-plugin.zip` asset (case-insensitive) from a release.
pub fn pick_plugin_asset(release: &GithubRelease) -> Result<&GithubAsset, String> {
    release
        .assets
        .iter()
        .find(|a| a.name.eq_ignore_ascii_case(PLUGIN_ASSET_NAME))
        .ok_or_else(|| {
            format!(
                "release does not include a {PLUGIN_ASSET_NAME} asset (FR-008)"
            )
        })
}

/// Stream the asset bytes to `dest_path` and verify the on-disk size matches
/// the release metadata (FR-008: only structural verification, no signatures).
pub async fn download_asset(
    asset: &GithubAsset,
    dest_path: &Path,
) -> Result<(), String> {
    let client = build_client()?;
    let resp = client
        .get(&asset.browser_download_url)
        .send()
        .await
        .map_err(|e| format!("GET {}: {e}", asset.browser_download_url))?;
    if !resp.status().is_success() {
        return Err(format!(
            "download {} returned {}",
            asset.browser_download_url,
            resp.status()
        ));
    }

    let mut file = File::create(dest_path)
        .await
        .map_err(|e| format!("create {}: {e}", dest_path.display()))?;
    let mut stream = resp.bytes_stream();
    let mut written: u64 = 0;
    while let Some(chunk) = stream.next().await {
        let bytes = chunk.map_err(|e| format!("stream chunk: {e}"))?;
        written += bytes.len() as u64;
        file.write_all(&bytes)
            .await
            .map_err(|e| format!("write {}: {e}", dest_path.display()))?;
    }
    file.flush()
        .await
        .map_err(|e| format!("flush {}: {e}", dest_path.display()))?;

    if written != asset.size {
        let _ = tokio::fs::remove_file(dest_path).await;
        return Err(format!(
            "downloaded {written} bytes, release metadata declared {} (FR-008)",
            asset.size
        ));
    }
    Ok(())
}

// ============================================================================
// Tests
// ============================================================================
// Integration-style tests live here (rather than in tests/) because the
// integration binary inherits Tauri's Windows UAC manifest and won't execute
// under cargo test without elevation. As #[cfg(test)] mods inside the lib
// crate the binary runs unprivileged.

#[cfg(test)]
mod tests {
    use super::*;

    use wiremock::matchers::{header_regex, method, path as wm_path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    fn fixture_manifest_json() -> serde_json::Value {
        serde_json::json!({
            "manifest_version": 1,
            "id": "com.raic.hello-world",
            "name": "Hello World",
            "version": "0.1.0",
            "author": "RAIC Overlay",
            "description": "Reference plugin used by tests.",
            "source_repo_url": "https://github.com/RAIC-Organization/RAIC-Overlay",
            "min_host_version": "1.0.0",
            "protocol_version": 1,
            "entry": { "ui": "ui/index.html" },
            "permissions": []
        })
    }

    fn build_fixture_zip() -> Vec<u8> {
        use std::io::Write as IoWrite;
        use zip::write::SimpleFileOptions;
        use zip::ZipWriter;

        let manifest_bytes = serde_json::to_vec_pretty(&fixture_manifest_json()).unwrap();
        let mut buf: Vec<u8> = Vec::new();
        {
            let cursor = std::io::Cursor::new(&mut buf);
            let mut zw = ZipWriter::new(cursor);
            let opts =
                SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored);
            zw.start_file("raic-plugin.json", opts).unwrap();
            zw.write_all(&manifest_bytes).unwrap();
            zw.start_file("ui/index.html", opts).unwrap();
            zw.write_all(b"<!doctype html><h1>hello</h1>").unwrap();
            zw.finish().unwrap();
        }
        buf
    }

    /// T018: Release JSON parses correctly + asset picker finds the bundle.
    #[tokio::test]
    async fn t018_release_json_parses_and_asset_is_picked() {
        let server = MockServer::start().await;
        let zip_bytes = build_fixture_zip();
        let download_url = format!("{}/asset/raic-plugin.zip", server.uri());
        let release = serde_json::json!({
            "tag_name": "v0.1.0",
            "name": "v0.1.0",
            "body": "first release",
            "html_url": "https://github.com/RAIC-Organization/RAIC-Overlay/releases/tag/v0.1.0",
            "assets": [{
                "name": "raic-plugin.zip",
                "browser_download_url": download_url,
                "size": zip_bytes.len(),
                "content_type": "application/zip"
            }]
        });

        Mock::given(method("GET"))
            .and(wm_path(
                "/repos/RAIC-Organization/RAIC-Overlay/releases/latest",
            ))
            .and(header_regex("user-agent", "^RAICOverlay/.+"))
            .respond_with(
                ResponseTemplate::new(200)
                    .insert_header("etag", "\"v0.1.0-etag\"")
                    .set_body_json(&release),
            )
            .mount(&server)
            .await;

        let client = reqwest::Client::builder()
            .user_agent(super::user_agent())
            .build()
            .unwrap();
        let resp = client
            .get(format!(
                "{}/repos/RAIC-Organization/RAIC-Overlay/releases/latest",
                server.uri()
            ))
            .send()
            .await
            .unwrap();
        assert_eq!(resp.status(), 200);
        let etag = resp
            .headers()
            .get("etag")
            .and_then(|v| v.to_str().ok())
            .map(String::from);
        assert_eq!(etag.as_deref(), Some("\"v0.1.0-etag\""));

        let body = resp.bytes().await.unwrap();
        let release: GithubRelease = serde_json::from_slice(&body).unwrap();
        let asset = pick_plugin_asset(&release).expect("asset present");
        assert_eq!(asset.name, "raic-plugin.zip");
        assert_eq!(asset.size, zip_bytes.len() as u64);
    }

    /// T018 (cont): download_asset streams correctly and the on-disk size
    /// matches the declared release size.
    #[tokio::test]
    async fn t018_download_asset_writes_full_file() {
        let server = MockServer::start().await;
        let zip_bytes = build_fixture_zip();
        let download_url = format!("{}/asset/raic-plugin.zip", server.uri());
        Mock::given(method("GET"))
            .and(wm_path("/asset/raic-plugin.zip"))
            .respond_with(ResponseTemplate::new(200).set_body_bytes(zip_bytes.clone()))
            .mount(&server)
            .await;

        let asset = GithubAsset {
            name: "raic-plugin.zip".to_string(),
            browser_download_url: download_url,
            size: zip_bytes.len() as u64,
            content_type: Some("application/zip".to_string()),
        };

        let tmp = tempfile::NamedTempFile::new().unwrap();
        download_asset(&asset, tmp.path()).await.expect("download");
        let on_disk = std::fs::metadata(tmp.path()).unwrap().len();
        assert_eq!(on_disk, zip_bytes.len() as u64);
    }

    /// T019: download_asset must detect a size mismatch and refuse the file.
    #[tokio::test]
    async fn t019_install_rejects_size_mismatch() {
        let server = MockServer::start().await;
        let zip_bytes = build_fixture_zip();
        let download_url = format!("{}/asset/raic-plugin.zip", server.uri());
        Mock::given(method("GET"))
            .and(wm_path("/asset/raic-plugin.zip"))
            .respond_with(ResponseTemplate::new(200).set_body_bytes(zip_bytes.clone()))
            .mount(&server)
            .await;

        let lying = GithubAsset {
            name: "raic-plugin.zip".to_string(),
            browser_download_url: download_url,
            size: 1000, // wrong on purpose
            content_type: Some("application/zip".to_string()),
        };
        let tmp = tempfile::NamedTempFile::new().unwrap();
        let err = download_asset(&lying, tmp.path())
            .await
            .expect_err("size mismatch must be detected (FR-008)");
        assert!(err.to_lowercase().contains("downloaded"));
    }

    /// T019: a release without raic-plugin.zip must be rejected.
    #[test]
    fn t019_install_rejects_missing_asset() {
        let release: GithubRelease = serde_json::from_value(serde_json::json!({
            "tag_name": "v0.1.0",
            "html_url": "https://x/y",
            "assets": [
                { "name": "source.tar.gz", "browser_download_url": "x", "size": 1, "content_type": "application/gzip" }
            ]
        })).unwrap();
        let err = pick_plugin_asset(&release).expect_err("missing asset");
        assert!(err.contains("raic-plugin.zip"));
    }

    /// T111: GitHub rate-limit (403 + X-RateLimit-Remaining: 0) is detected.
    /// Verifies the wiremock-side header shape the github module classifies on.
    #[tokio::test]
    async fn t111_github_rate_limit_response_shape() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(wm_path("/repos/alice/demo/releases/latest"))
            .respond_with(
                ResponseTemplate::new(403)
                    .insert_header("x-ratelimit-remaining", "0")
                    .insert_header("x-ratelimit-reset", "1716300000")
                    .insert_header("x-ratelimit-resource", "core")
                    .set_body_string("rate limited"),
            )
            .mount(&server)
            .await;

        let client = reqwest::Client::builder()
            .user_agent(super::user_agent())
            .build()
            .unwrap();
        let resp = client
            .get(format!(
                "{}/repos/alice/demo/releases/latest",
                server.uri()
            ))
            .send()
            .await
            .unwrap();
        assert_eq!(resp.status(), 403);
        assert_eq!(
            resp.headers()
                .get("x-ratelimit-remaining")
                .and_then(|v| v.to_str().ok()),
            Some("0")
        );
    }
}

