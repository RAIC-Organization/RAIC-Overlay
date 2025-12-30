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
///
/// This command is IDEMPOTENT: if a WebView for the given window_id already exists,
/// it returns the existing webview_id without error. This handles React Strict Mode
/// double-mounting gracefully.
#[tauri::command]
pub async fn create_browser_webview(
    app: AppHandle,
    state: State<'_, BrowserWebViewState>,
    window_id: String,
    initial_url: String,
    bounds: BrowserWebViewBounds,
    zoom: f64,
    opacity: Option<f64>,
) -> Result<String, String> {
    let webview_id = format!("browser-webview-{}", window_id);

    // IDEMPOTENT CHECK: If WebView already exists, return existing ID
    // This handles React Strict Mode double-mounting gracefully
    if app.get_webview_window(&webview_id).is_some() {
        log::debug!(
            "Browser WebView {} already exists, returning existing ID (idempotent)",
            webview_id
        );
        return Ok(webview_id);
    }

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
    // CRITICAL: focused(false) prevents WebView from stealing focus from main overlay
    // skip_taskbar(true) keeps the browser window hidden from taskbar
    let webview = WebviewWindowBuilder::new(&app, &webview_id, WebviewUrl::External(url))
        .title("Browser Content")
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .inner_size(bounds.width, bounds.height)
        .position(bounds.x, bounds.y)
        .visible(true)
        .focused(false)  // Don't steal focus from main overlay window
        .skip_taskbar(true)  // Hide from taskbar
        .build()
        .map_err(|e| format!("Failed to create WebView: {}", e))?;

    // Set initial zoom
    webview
        .set_zoom(zoom_factor)
        .map_err(|e| format!("Failed to set zoom: {}", e))?;

    // Set initial opacity if provided
    #[cfg(target_os = "windows")]
    if let Some(opacity_value) = opacity {
        use windows::Win32::Foundation::{COLORREF, HWND};
        use windows::Win32::UI::WindowsAndMessaging::{
            GetWindowLongW, SetLayeredWindowAttributes, SetWindowLongW, SetWindowPos,
            GWL_EXSTYLE, HWND_TOPMOST, LWA_ALPHA, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE,
            WS_EX_LAYERED,
        };

        let hwnd = webview.hwnd().map_err(|e| format!("Failed to get HWND: {}", e))?;
        let hwnd = HWND(hwnd.0);

        unsafe {
            // Ensure WS_EX_LAYERED style is set
            let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
            if ex_style & WS_EX_LAYERED.0 as i32 == 0 {
                SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style | WS_EX_LAYERED.0 as i32);
            }

            // Set opacity (0-255 range)
            let alpha = (opacity_value.clamp(0.0, 1.0) * 255.0) as u8;
            SetLayeredWindowAttributes(hwnd, COLORREF(0), alpha, LWA_ALPHA)
                .map_err(|e| format!("Failed to set initial opacity: {}", e))?;

            // Re-apply z-order after setting layered attributes
            SetWindowPos(
                hwnd,
                Some(HWND_TOPMOST),
                0, 0, 0, 0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            )
            .map_err(|e| format!("SetWindowPos failed: {}", e))?;
        }

        log::debug!("WebView {} initial opacity set to {:.0}%", webview_id, opacity_value * 100.0);
    }

    // Register in state
    state.register(&webview_id, &window_id, &normalized_url, zoom_factor);

    log::info!("Created browser WebView: {} -> {}", webview_id, normalized_url);

    Ok(webview_id)
}

/// T006: Destroy a browser WebView window
///
/// Closes and cleans up the WebView when the browser window is closed.
///
/// This command is IDEMPOTENT: if the WebView doesn't exist, it returns
/// success without error. This handles React Strict Mode cleanup gracefully.
#[tauri::command]
pub fn destroy_browser_webview(
    app: AppHandle,
    state: State<'_, BrowserWebViewState>,
    webview_id: String,
) -> Result<(), String> {
    log::debug!("Destroying browser WebView: {}", webview_id);

    // Close the WebView window if it exists (idempotent - no error if missing)
    if let Some(webview) = app.get_webview_window(&webview_id) {
        webview
            .close()
            .map_err(|e| format!("Failed to close WebView: {}", e))?;
        log::info!("Destroyed browser WebView: {}", webview_id);
    } else {
        log::debug!(
            "Browser WebView {} already destroyed or never existed (idempotent)",
            webview_id
        );
    }

    // Unregister from state (also idempotent - no error if not registered)
    state.unregister(&webview_id);

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

    // Use Windows API SetWindowPos to set position, size, AND z-order in one call
    // This ensures the WebView stays on top of other always-on-top windows
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::WindowsAndMessaging::{SetWindowPos, HWND_TOPMOST, SWP_NOACTIVATE};

        let hwnd = webview.hwnd().map_err(|e| format!("Failed to get HWND: {}", e))?;
        let hwnd = HWND(hwnd.0);

        unsafe {
            // SetWindowPos with HWND_TOPMOST places window at top of z-order
            // SWP_NOACTIVATE prevents stealing focus
            SetWindowPos(
                hwnd,
                Some(HWND_TOPMOST),
                bounds.x as i32,
                bounds.y as i32,
                bounds.width as i32,
                bounds.height as i32,
                SWP_NOACTIVATE,
            )
            .map_err(|e| format!("SetWindowPos failed: {}", e))?;
        }
    }

    // Fallback for non-Windows platforms
    #[cfg(not(target_os = "windows"))]
    {
        use tauri::{LogicalPosition, LogicalSize, Position, Size};

        webview
            .set_position(Position::Logical(LogicalPosition::new(bounds.x, bounds.y)))
            .map_err(|e| format!("Failed to set position: {}", e))?;

        webview
            .set_size(Size::Logical(LogicalSize::new(bounds.width, bounds.height)))
            .map_err(|e| format!("Failed to set size: {}", e))?;

        webview
            .set_always_on_top(true)
            .map_err(|e| format!("Failed to set always on top: {}", e))?;
    }

    Ok(())
}

/// T044: Set the opacity/alpha of the WebView window
///
/// Uses Windows SetLayeredWindowAttributes API to set window transparency.
/// Opacity range: 0.0 (fully transparent) to 1.0 (fully opaque)
#[tauri::command]
pub fn set_browser_webview_opacity(
    app: AppHandle,
    webview_id: String,
    opacity: f64,
) -> Result<(), String> {
    log::debug!(
        "Setting WebView {} opacity to {:.0}%",
        webview_id,
        opacity * 100.0
    );

    let webview = app
        .get_webview_window(&webview_id)
        .ok_or_else(|| format!("WebView not found: {}", webview_id))?;

    // Use Windows API to set window opacity
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::{COLORREF, HWND};
        use windows::Win32::UI::WindowsAndMessaging::{
            GetWindowLongW, SetLayeredWindowAttributes, SetWindowLongW, GWL_EXSTYLE,
            LWA_ALPHA, WS_EX_LAYERED,
        };

        // Get the HWND from the WebView window
        let hwnd = webview.hwnd().map_err(|e| format!("Failed to get HWND: {}", e))?;
        let hwnd = HWND(hwnd.0);

        unsafe {
            // Ensure WS_EX_LAYERED style is set
            let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
            if ex_style & WS_EX_LAYERED.0 as i32 == 0 {
                SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style | WS_EX_LAYERED.0 as i32);
            }

            // Set opacity (0-255 range)
            // crKey is ignored when using LWA_ALPHA, but we must provide a value
            let alpha = (opacity.clamp(0.0, 1.0) * 255.0) as u8;
            SetLayeredWindowAttributes(hwnd, COLORREF(0), alpha, LWA_ALPHA)
                .map_err(|e| format!("Failed to set opacity: {}", e))?;

            // Re-apply z-order using SetWindowPos with HWND_TOPMOST
            // Setting layered window attributes can affect z-order
            use windows::Win32::UI::WindowsAndMessaging::{
                SetWindowPos, HWND_TOPMOST, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE,
            };
            SetWindowPos(
                hwnd,
                Some(HWND_TOPMOST),
                0, 0, 0, 0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            )
            .map_err(|e| format!("SetWindowPos failed: {}", e))?;
        }
    }

    log::debug!("WebView {} opacity set to {:.0}%", webview_id, opacity * 100.0);
    Ok(())
}

/// Set whether the WebView should ignore cursor/mouse events
///
/// When true, clicks pass through to windows behind the WebView.
/// Used for non-interactive (fullscreen/passive) mode.
#[tauri::command]
pub fn set_browser_webview_ignore_cursor(
    app: AppHandle,
    webview_id: String,
    ignore: bool,
) -> Result<(), String> {
    log::debug!(
        "Setting WebView {} ignore cursor events to {}",
        webview_id,
        ignore
    );

    let webview = app
        .get_webview_window(&webview_id)
        .ok_or_else(|| format!("WebView not found: {}", webview_id))?;

    webview
        .set_ignore_cursor_events(ignore)
        .map_err(|e| format!("Failed to set ignore cursor events: {}", e))?;

    log::debug!(
        "WebView {} ignore cursor events set to {}",
        webview_id,
        ignore
    );
    Ok(())
}

/// Bring a WebView to the front of the z-order
///
/// Uses SetWindowPos with HWND_TOPMOST to ensure the WebView is above
/// all other windows. Called when mouse enters the browser component area.
#[tauri::command]
pub fn bring_browser_webview_to_front(app: AppHandle, webview_id: String) -> Result<(), String> {
    let webview = app
        .get_webview_window(&webview_id)
        .ok_or_else(|| format!("WebView not found: {}", webview_id))?;

    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::WindowsAndMessaging::{
            SetWindowPos, HWND_TOPMOST, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE,
        };

        let hwnd = webview.hwnd().map_err(|e| format!("Failed to get HWND: {}", e))?;
        let hwnd = HWND(hwnd.0);

        unsafe {
            SetWindowPos(
                hwnd,
                Some(HWND_TOPMOST),
                0, 0, 0, 0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            )
            .map_err(|e| format!("SetWindowPos failed: {}", e))?;
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        webview
            .set_always_on_top(true)
            .map_err(|e| format!("Failed to set always on top: {}", e))?;
    }

    Ok(())
}

/// T053: Set the visibility of a WebView window
///
/// Shows or hides the WebView window to sync with overlay visibility.
#[tauri::command]
pub fn set_browser_webview_visibility(
    app: AppHandle,
    state: State<'_, BrowserWebViewState>,
    webview_id: String,
    visible: bool,
) -> Result<(), String> {
    log::debug!("Setting WebView {} visibility to {}", webview_id, visible);

    let webview = app
        .get_webview_window(&webview_id)
        .ok_or_else(|| format!("WebView not found: {}", webview_id))?;

    if visible {
        webview
            .show()
            .map_err(|e| format!("Failed to show WebView: {}", e))?;
    } else {
        webview
            .hide()
            .map_err(|e| format!("Failed to hide WebView: {}", e))?;
    }

    // Update visibility in state
    state.update_visibility(&webview_id, visible);

    log::debug!("WebView {} visibility set to {}", webview_id, visible);
    Ok(())
}

/// T055a: Set all browser WebViews visibility at once
///
/// Used by overlay toggle to hide/show all WebViews together.
#[tauri::command]
pub fn set_all_browser_webviews_visibility(
    app: AppHandle,
    state: State<'_, BrowserWebViewState>,
    visible: bool,
) -> Result<(), String> {
    log::debug!("Setting all browser WebViews visibility to {}", visible);

    let labels = state.get_all_labels();
    let mut errors = Vec::new();

    for webview_id in labels {
        if let Some(webview) = app.get_webview_window(&webview_id) {
            let result = if visible {
                webview.show()
            } else {
                webview.hide()
            };

            if let Err(e) = result {
                errors.push(format!("{}: {}", webview_id, e));
            } else {
                state.update_visibility(&webview_id, visible);
            }
        }
    }

    if errors.is_empty() {
        log::debug!("All browser WebViews visibility set to {}", visible);
        Ok(())
    } else {
        Err(format!("Some WebViews failed: {}", errors.join(", ")))
    }
}

/// T056, T057: Internal function for lib.rs to call without State extraction
///
/// Used by overlay toggle to hide/show all WebViews together.
pub fn set_all_browser_webviews_visibility_internal(
    app: &AppHandle,
    state: &BrowserWebViewState,
    visible: bool,
) -> Result<(), String> {
    log::debug!("Setting all browser WebViews visibility to {} (internal)", visible);

    let labels = state.get_all_labels();
    let mut errors = Vec::new();

    for webview_id in labels {
        if let Some(webview) = app.get_webview_window(&webview_id) {
            let result = if visible {
                webview.show()
            } else {
                webview.hide()
            };

            if let Err(e) = result {
                errors.push(format!("{}: {}", webview_id, e));
            } else {
                state.update_visibility(&webview_id, visible);
            }
        }
    }

    if errors.is_empty() {
        log::debug!("All browser WebViews visibility set to {} (internal)", visible);
        Ok(())
    } else {
        Err(format!("Some WebViews failed: {}", errors.join(", ")))
    }
}

/// T058: Destroy all browser WebViews (cleanup on app exit)
///
/// Closes all browser WebView windows and clears state.
#[tauri::command]
pub fn destroy_all_browser_webviews(
    app: AppHandle,
    state: State<'_, BrowserWebViewState>,
) -> Result<(), String> {
    log::debug!("Destroying all browser WebViews");

    let labels = state.get_all_labels();

    for webview_id in labels {
        if let Some(webview) = app.get_webview_window(&webview_id) {
            if let Err(e) = webview.close() {
                log::warn!("Failed to close WebView {}: {}", webview_id, e);
            }
        }
        state.unregister(&webview_id);
    }

    log::info!("All browser WebViews destroyed");
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
