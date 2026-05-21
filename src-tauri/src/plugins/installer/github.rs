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
