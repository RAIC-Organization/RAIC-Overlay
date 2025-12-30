//! Browser WebView Management
//!
//! Tauri commands for creating, destroying, and controlling browser WebViews.
//! These WebViews replace iframe-based content to bypass X-Frame-Options restrictions.
//!
//! @feature 040-webview-browser

use crate::browser_webview_types::{BrowserWebViewBounds, BrowserWebViewState};
use tauri::{AppHandle, Manager, State, WebviewUrl, WebviewWindowBuilder};

/// T005: Create a new browser WebView window
///
/// Creates a frameless, transparent, always-on-top WebView that renders external URLs.
/// The WebView is positioned and sized according to the provided bounds.
#[tauri::command]
pub async fn create_browser_webview(
    app: AppHandle,
    state: State<'_, BrowserWebViewState>,
    window_id: String,
    initial_url: String,
    bounds: BrowserWebViewBounds,
    zoom: f64,
) -> Result<String, String> {
    let webview_id = format!("browser-webview-{}", window_id);

    log::debug!(
        "Creating browser WebView: {} for window {} at ({}, {}) {}x{}",
        webview_id,
        window_id,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height
    );

    // Validate bounds
    if !bounds.is_valid() {
        return Err("Invalid bounds: all values must be non-negative and dimensions must be positive".to_string());
    }

    // Clamp zoom to valid range
    let zoom_factor = zoom.clamp(0.1, 2.0);

    // Normalize URL: add https:// if no protocol
    let normalized_url = normalize_url(&initial_url)?;

    // Parse URL
    let url = normalized_url
        .parse::<tauri::Url>()
        .map_err(|e| format!("Invalid URL '{}': {}", normalized_url, e))?;

    // T010: Create the WebView window with frameless, transparent, always-on-top config
    // T012: Popup blocking is implicit - we don't register any new window handler
    let webview = WebviewWindowBuilder::new(&app, &webview_id, WebviewUrl::External(url))
        .title("Browser Content")
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .inner_size(bounds.width, bounds.height)
        .position(bounds.x, bounds.y)
        .visible(true)
        // T012: Block javascript: and data: URL navigation (popup/XSS prevention)
        .on_navigation(|url| {
            let scheme = url.scheme();
            let allowed = scheme != "javascript" && scheme != "data";
            if !allowed {
                log::debug!("Blocked navigation to {} URL", scheme);
            }
            allowed
        })
        .build()
        .map_err(|e| format!("Failed to create WebView: {}", e))?;

    // Set initial zoom
    webview
        .set_zoom(zoom_factor)
        .map_err(|e| format!("Failed to set zoom: {}", e))?;

    // Register in state
    state.register(&webview_id, &window_id, &normalized_url, zoom_factor);

    log::info!("Created browser WebView: {} -> {}", webview_id, normalized_url);

    Ok(webview_id)
}

/// T006: Destroy a browser WebView window
///
/// Closes and cleans up the WebView when the browser window is closed.
#[tauri::command]
pub fn destroy_browser_webview(
    app: AppHandle,
    state: State<'_, BrowserWebViewState>,
    webview_id: String,
) -> Result<(), String> {
    log::debug!("Destroying browser WebView: {}", webview_id);

    // Close the WebView window
    if let Some(webview) = app.get_webview_window(&webview_id) {
        webview
            .close()
            .map_err(|e| format!("Failed to close WebView: {}", e))?;
    }

    // Unregister from state
    state.unregister(&webview_id);

    log::info!("Destroyed browser WebView: {}", webview_id);

    Ok(())
}

/// Normalize URL by adding https:// if no protocol is present.
fn normalize_url(url: &str) -> Result<String, String> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return Err("URL cannot be empty".to_string());
    }

    // Check if URL already has a protocol
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        Ok(trimmed.to_string())
    } else if trimmed.starts_with("file://") {
        // Allow file:// URLs
        Ok(trimmed.to_string())
    } else {
        // Default to https://
        Ok(format!("https://{}", trimmed))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_url_with_https() {
        assert_eq!(
            normalize_url("https://google.com").unwrap(),
            "https://google.com"
        );
    }

    #[test]
    fn test_normalize_url_with_http() {
        assert_eq!(
            normalize_url("http://example.com").unwrap(),
            "http://example.com"
        );
    }

    #[test]
    fn test_normalize_url_without_protocol() {
        assert_eq!(
            normalize_url("google.com").unwrap(),
            "https://google.com"
        );
    }

    #[test]
    fn test_normalize_url_with_whitespace() {
        assert_eq!(
            normalize_url("  https://google.com  ").unwrap(),
            "https://google.com"
        );
    }

    #[test]
    fn test_normalize_url_empty() {
        assert!(normalize_url("").is_err());
        assert!(normalize_url("   ").is_err());
    }

    #[test]
    fn test_normalize_url_file_protocol() {
        assert_eq!(
            normalize_url("file:///path/to/file.html").unwrap(),
            "file:///path/to/file.html"
        );
    }
}
