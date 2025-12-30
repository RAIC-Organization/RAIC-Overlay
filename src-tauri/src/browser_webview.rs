//! Browser WebView Management
//!
//! Tauri commands for creating, destroying, and controlling browser WebViews.
//! These WebViews replace iframe-based content to bypass X-Frame-Options restrictions.
//!
//! @feature 040-webview-browser

use crate::browser_webview_types::{BrowserUrlPayload, BrowserWebViewBounds, BrowserWebViewState};
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};

/// T036: Build the browser WebView plugin that hooks into navigation events.
///
/// This plugin emits `browser-url-changed` events when WebViews navigate,
/// allowing the frontend to sync the URL bar.
pub fn build_browser_webview_plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri::plugin::Builder::new("browser-webview")
        .on_navigation(|window, url| {
            let label = window.label();

            // Only handle browser-webview-* windows
            if !label.starts_with("browser-webview-") {
                return true; // Allow navigation for non-browser windows
            }

            let scheme = url.scheme();

            // T012: Block javascript: and data: URL navigation (popup/XSS prevention)
            if scheme == "javascript" || scheme == "data" {
                log::debug!("Blocked navigation to {} URL in {}", scheme, label);
                return false;
            }

            // T036, T037: Emit browser-url-changed event with navigation info
            let url_string = url.to_string();
            log::debug!("Navigation in {}: {}", label, url_string);

            // We can't determine canGoBack/canGoForward from here reliably,
            // so we set them to true and let the frontend handle disabling
            // based on actual navigation attempts
            let payload = BrowserUrlPayload {
                webview_id: label.to_string(),
                url: url_string,
                can_go_back: true,  // Will be refined by actual navigation
                can_go_forward: false,  // Forward is typically false after new navigation
            };

            if let Err(e) = window.emit("browser-url-changed", &payload) {
                log::warn!("Failed to emit browser-url-changed: {}", e);
            }

            true // Allow navigation
        })
        .build()
}

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
    // T012: Popup blocking handled by browser-webview plugin's on_navigation hook
    // T036: URL change events also handled by plugin
    let webview = WebviewWindowBuilder::new(&app, &webview_id, WebviewUrl::External(url))
        .title("Browser Content")
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .inner_size(bounds.width, bounds.height)
        .position(bounds.x, bounds.y)
        .visible(true)
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

/// T017: Navigate the WebView to a new URL
///
/// Changes the WebView's current page to the specified URL.
#[tauri::command]
pub fn browser_navigate(app: AppHandle, webview_id: String, url: String) -> Result<(), String> {
    log::debug!("Navigating WebView {} to {}", webview_id, url);

    let webview = app
        .get_webview_window(&webview_id)
        .ok_or_else(|| format!("WebView not found: {}", webview_id))?;

    // Normalize URL
    let normalized_url = normalize_url(&url)?;

    // Parse and navigate
    let parsed_url = normalized_url
        .parse::<tauri::Url>()
        .map_err(|e| format!("Invalid URL '{}': {}", normalized_url, e))?;

    webview
        .navigate(parsed_url)
        .map_err(|e| format!("Navigation failed: {}", e))?;

    log::info!("WebView {} navigating to {}", webview_id, normalized_url);
    Ok(())
}

/// T018: Navigate back in the WebView history
///
/// Goes back one page in the WebView's navigation history.
#[tauri::command]
pub fn browser_go_back(app: AppHandle, webview_id: String) -> Result<(), String> {
    log::debug!("WebView {} going back", webview_id);

    let webview = app
        .get_webview_window(&webview_id)
        .ok_or_else(|| format!("WebView not found: {}", webview_id))?;

    // Execute JavaScript to go back
    webview
        .eval("window.history.back()")
        .map_err(|e| format!("Go back failed: {}", e))?;

    Ok(())
}

/// T019: Navigate forward in the WebView history
///
/// Goes forward one page in the WebView's navigation history.
#[tauri::command]
pub fn browser_go_forward(app: AppHandle, webview_id: String) -> Result<(), String> {
    log::debug!("WebView {} going forward", webview_id);

    let webview = app
        .get_webview_window(&webview_id)
        .ok_or_else(|| format!("WebView not found: {}", webview_id))?;

    // Execute JavaScript to go forward
    webview
        .eval("window.history.forward()")
        .map_err(|e| format!("Go forward failed: {}", e))?;

    Ok(())
}

/// T020: Refresh the current page in the WebView
///
/// Reloads the current page in the WebView.
#[tauri::command]
pub fn browser_refresh(app: AppHandle, webview_id: String) -> Result<(), String> {
    log::debug!("WebView {} refreshing", webview_id);

    let webview = app
        .get_webview_window(&webview_id)
        .ok_or_else(|| format!("WebView not found: {}", webview_id))?;

    // Execute JavaScript to reload
    webview
        .eval("window.location.reload()")
        .map_err(|e| format!("Refresh failed: {}", e))?;

    Ok(())
}

/// T021: Set the zoom level of the WebView
///
/// Changes the WebView's zoom factor (0.1 - 2.0).
#[tauri::command]
pub fn set_browser_zoom(app: AppHandle, webview_id: String, zoom: f64) -> Result<(), String> {
    log::debug!("Setting WebView {} zoom to {}", webview_id, zoom);

    let webview = app
        .get_webview_window(&webview_id)
        .ok_or_else(|| format!("WebView not found: {}", webview_id))?;

    // Clamp zoom to valid range
    let zoom_factor = zoom.clamp(0.1, 2.0);

    webview
        .set_zoom(zoom_factor)
        .map_err(|e| format!("Set zoom failed: {}", e))?;

    log::info!("WebView {} zoom set to {:.0}%", webview_id, zoom_factor * 100.0);
    Ok(())
}

/// T028: Synchronize WebView bounds with browser window content area
///
/// Updates the WebView position and size to match the browser window's content area.
/// Uses logical pixels for DPI-independent positioning.
/// Performance target: must complete within 100ms.
#[tauri::command]
pub fn sync_browser_webview_bounds(
    app: AppHandle,
    webview_id: String,
    bounds: BrowserWebViewBounds,
) -> Result<(), String> {
    log::debug!(
        "Syncing WebView {} bounds to ({}, {}) {}x{}",
        webview_id,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height
    );

    // Validate bounds
    if !bounds.is_valid() {
        return Err("Invalid bounds: all values must be non-negative and dimensions must be positive".to_string());
    }

    let webview = app
        .get_webview_window(&webview_id)
        .ok_or_else(|| format!("WebView not found: {}", webview_id))?;

    // Use logical pixels for DPI-independent positioning
    use tauri::{LogicalPosition, LogicalSize, Position, Size};

    webview
        .set_position(Position::Logical(LogicalPosition::new(bounds.x, bounds.y)))
        .map_err(|e| format!("Failed to set position: {}", e))?;

    webview
        .set_size(Size::Logical(LogicalSize::new(bounds.width, bounds.height)))
        .map_err(|e| format!("Failed to set size: {}", e))?;

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
