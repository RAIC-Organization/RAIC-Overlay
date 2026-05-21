// Custom URI scheme protocol "plugin" — serves the UI bundle of an installed
// plugin from disk into its webview.
//
// On Windows + WebView2 the URL the plugin window loads is
//   http://plugin.localhost/<plugin-id>/<relative-path>
// and the scheme name registered with Tauri is just "plugin".
//
// We strictly validate that the resolved path stays under the plugin's
// versioned install directory (no zip-slip after install via crafted URLs).

use std::borrow::Cow;
use std::path::PathBuf;

use tauri::http::{Request, Response, StatusCode};
use tauri::{Manager, UriSchemeContext, Wry};

use crate::plugins::registry::{plugin_install_dir, PluginRegistryState};

/// The scheme name to register with `Builder::register_uri_scheme_protocol`.
pub const SCHEME: &str = "plugin";

/// Handler for `plugin://localhost/<id>/<path>` (or `http://plugin.localhost/...`
/// on Windows). Returns the file contents on disk, or 404 / 403 on error.
pub fn handle(
    ctx: UriSchemeContext<'_, Wry>,
    request: Request<Vec<u8>>,
) -> Response<Cow<'static, [u8]>> {
    let url_str = request.uri().to_string();
    log::trace!("plugin protocol request: {url_str}");

    let parsed = match parse_url(&url_str) {
        Some(p) => p,
        None => return not_found(format!("malformed plugin URL: {url_str}")),
    };

    let app = ctx.app_handle();
    let registry = app.state::<PluginRegistryState>();
    let plugin = match registry.get(&parsed.plugin_id) {
        Some(p) => p,
        None => return not_found(format!("plugin not installed: {}", parsed.plugin_id)),
    };

    if !plugin.enabled {
        return forbidden(format!("plugin disabled: {}", parsed.plugin_id));
    }

    let install_dir = match plugin_install_dir(app, &plugin.id, &plugin.installed_version) {
        Ok(d) => d,
        Err(e) => return internal_error(format!("resolve install dir: {e}")),
    };

    // Resolve the requested path, then canonicalise + verify it is still
    // under the install dir (zip-slip guard for URLs).
    let requested = install_dir.join(&parsed.path);
    let resolved = match requested.canonicalize() {
        Ok(r) => r,
        Err(_) => return not_found(format!("not found: {}", parsed.path)),
    };
    let install_canon = match install_dir.canonicalize() {
        Ok(r) => r,
        Err(e) => return internal_error(format!("canonicalize install dir: {e}")),
    };
    if !resolved.starts_with(&install_canon) {
        log::warn!(
            "[plugin={}] path traversal blocked: {}",
            plugin.id,
            parsed.path
        );
        return forbidden("path traversal blocked".to_string());
    }

    match std::fs::read(&resolved) {
        Ok(bytes) => {
            let mime = guess_mime(&resolved);
            Response::builder()
                .status(StatusCode::OK)
                .header("content-type", mime)
                .header("access-control-allow-origin", "*")
                .body(Cow::Owned(bytes))
                .unwrap_or_else(|e| {
                    log::error!("response builder failure: {e}");
                    internal_error(format!("response builder: {e}"))
                })
        }
        Err(e) => not_found(format!("read {resolved:?}: {e}")),
    }
}

#[derive(Debug)]
struct PluginUrl {
    plugin_id: String,
    path: String,
}

/// Extract `(plugin_id, relative_path)` from either form of the URL:
///   plugin://localhost/<id>/<path>
///   http://plugin.localhost/<id>/<path>
fn parse_url(url: &str) -> Option<PluginUrl> {
    let parsed = url::Url::parse(url).ok()?;
    // The "host" is "localhost" (for plugin://) or "plugin.localhost" (for http://).
    // The plugin id + path are in the URL path: /<id>/<path>
    let mut segments = parsed
        .path_segments()?
        .filter(|s| !s.is_empty())
        .collect::<Vec<&str>>()
        .into_iter();
    let id = segments.next()?.to_string();
    let rest: Vec<&str> = segments.collect();
    let path = if rest.is_empty() {
        "index.html".to_string()
    } else {
        rest.join("/")
    };
    // Reject any segment that is exactly "..".
    if rest.iter().any(|s| *s == "..") {
        return None;
    }
    Some(PluginUrl {
        plugin_id: id,
        path,
    })
}

fn guess_mime(p: &PathBuf) -> &'static str {
    match p.extension().and_then(|e| e.to_str()).unwrap_or("") {
        "html" | "htm" => "text/html; charset=utf-8",
        "js" | "mjs" => "application/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "ico" => "image/x-icon",
        "wasm" => "application/wasm",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        "txt" | "md" => "text/plain; charset=utf-8",
        _ => "application/octet-stream",
    }
}

fn not_found(msg: String) -> Response<Cow<'static, [u8]>> {
    log::debug!("plugin protocol 404: {msg}");
    Response::builder()
        .status(StatusCode::NOT_FOUND)
        .header("content-type", "text/plain; charset=utf-8")
        .body(Cow::Owned(msg.into_bytes()))
        .expect("404 response build")
}

fn forbidden(msg: String) -> Response<Cow<'static, [u8]>> {
    log::warn!("plugin protocol 403: {msg}");
    Response::builder()
        .status(StatusCode::FORBIDDEN)
        .header("content-type", "text/plain; charset=utf-8")
        .body(Cow::Owned(msg.into_bytes()))
        .expect("403 response build")
}

fn internal_error(msg: String) -> Response<Cow<'static, [u8]>> {
    log::error!("plugin protocol 500: {msg}");
    Response::builder()
        .status(StatusCode::INTERNAL_SERVER_ERROR)
        .header("content-type", "text/plain; charset=utf-8")
        .body(Cow::Owned(msg.into_bytes()))
        .expect("500 response build")
}
