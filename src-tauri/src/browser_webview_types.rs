//! Browser WebView Types
//!
//! Rust type definitions for the WebView browser architecture.
//! Used by browser_webview module and lib.rs for state management.
//!
//! @feature 040-webview-browser

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

/// Position and size for WebView synchronization.
/// All values in logical pixels (DPI-independent).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserWebViewBounds {
    /// X position in logical pixels
    pub x: f64,
    /// Y position in logical pixels
    pub y: f64,
    /// Width in logical pixels
    pub width: f64,
    /// Height in logical pixels
    pub height: f64,
}

impl BrowserWebViewBounds {
    /// Validate bounds are non-negative and have positive dimensions.
    pub fn is_valid(&self) -> bool {
        self.x >= 0.0 && self.y >= 0.0 && self.width > 0.0 && self.height > 0.0
    }
}

/// Information about a single browser WebView.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserWebViewInfo {
    /// Unique webview label (e.g., "browser-webview-abc123")
    pub webview_id: String,
    /// Associated React browser window ID
    pub window_id: String,
    /// Last known URL
    pub current_url: String,
    /// Current zoom factor (0.1 - 2.0)
    pub zoom_factor: f64,
    /// Current visibility state
    pub is_visible: bool,
    /// Z-order index for layering multiple browser windows
    pub z_order: u32,
}

impl BrowserWebViewInfo {
    /// Create a new BrowserWebViewInfo with default values.
    pub fn new(webview_id: String, window_id: String, initial_url: String, zoom_factor: f64) -> Self {
        Self {
            webview_id,
            window_id,
            current_url: initial_url,
            zoom_factor,
            is_visible: true,
            z_order: 0,
        }
    }
}

/// Event payload for URL change notifications.
/// Uses camelCase for JSON serialization to match TypeScript interface.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserUrlPayload {
    /// Source webview label
    pub webview_id: String,
    /// New URL after navigation
    pub url: String,
    /// Whether back navigation is available
    pub can_go_back: bool,
    /// Whether forward navigation is available
    pub can_go_forward: bool,
}

/// Event payload for error notifications.
/// Uses camelCase for JSON serialization to match TypeScript interface.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserErrorPayload {
    /// Source webview label
    pub webview_id: String,
    /// Error category
    pub error_type: String,
    /// Human-readable error message
    pub message: String,
}

/// Event payload for loading state notifications.
/// Uses camelCase for JSON serialization to match TypeScript interface.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserLoadingPayload {
    /// Source webview label
    pub webview_id: String,
    /// Whether the WebView is currently loading
    pub is_loading: bool,
}

/// Tracks all active browser WebViews for overlay integration.
/// Thread-safe via Mutex wrapper.
#[derive(Debug, Default)]
pub struct BrowserWebViewState {
    /// Map of webview labels to their info
    webviews: Mutex<HashMap<String, BrowserWebViewInfo>>,
    /// Counter for z-order assignment
    next_z_order: Mutex<u32>,
}

impl BrowserWebViewState {
    /// Create a new empty state.
    pub fn new() -> Self {
        Self {
            webviews: Mutex::new(HashMap::new()),
            next_z_order: Mutex::new(0),
        }
    }

    /// Register a new WebView.
    pub fn register(&self, webview_id: &str, window_id: &str, initial_url: &str, zoom_factor: f64) {
        let mut webviews = self.webviews.lock().unwrap();
        let mut z_order = self.next_z_order.lock().unwrap();

        let mut info = BrowserWebViewInfo::new(
            webview_id.to_string(),
            window_id.to_string(),
            initial_url.to_string(),
            zoom_factor,
        );
        info.z_order = *z_order;
        *z_order += 1;

        webviews.insert(webview_id.to_string(), info);
        log::debug!("Registered browser WebView: {} (window: {})", webview_id, window_id);
    }

    /// Unregister a WebView.
    pub fn unregister(&self, webview_id: &str) -> Option<BrowserWebViewInfo> {
        let mut webviews = self.webviews.lock().unwrap();
        let info = webviews.remove(webview_id);
        if info.is_some() {
            log::debug!("Unregistered browser WebView: {}", webview_id);
        }
        info
    }

    /// Get all WebView labels.
    pub fn get_all_labels(&self) -> Vec<String> {
        let webviews = self.webviews.lock().unwrap();
        webviews.keys().cloned().collect()
    }

    /// Get WebView ID by window ID.
    pub fn get_by_window_id(&self, window_id: &str) -> Option<String> {
        let webviews = self.webviews.lock().unwrap();
        webviews
            .values()
            .find(|info| info.window_id == window_id)
            .map(|info| info.webview_id.clone())
    }

    /// Get WebView info by ID.
    pub fn get_info(&self, webview_id: &str) -> Option<BrowserWebViewInfo> {
        let webviews = self.webviews.lock().unwrap();
        webviews.get(webview_id).cloned()
    }

    /// Update URL for a WebView.
    pub fn update_url(&self, webview_id: &str, url: &str) {
        let mut webviews = self.webviews.lock().unwrap();
        if let Some(info) = webviews.get_mut(webview_id) {
            info.current_url = url.to_string();
        }
    }

    /// Update zoom factor for a WebView.
    pub fn update_zoom(&self, webview_id: &str, zoom_factor: f64) {
        let mut webviews = self.webviews.lock().unwrap();
        if let Some(info) = webviews.get_mut(webview_id) {
            info.zoom_factor = zoom_factor;
        }
    }

    /// Update visibility for a WebView.
    pub fn update_visibility(&self, webview_id: &str, is_visible: bool) {
        let mut webviews = self.webviews.lock().unwrap();
        if let Some(info) = webviews.get_mut(webview_id) {
            info.is_visible = is_visible;
        }
    }

    /// Bring a WebView to front (highest z-order).
    pub fn bring_to_front(&self, webview_id: &str) {
        let mut webviews = self.webviews.lock().unwrap();
        let mut z_order = self.next_z_order.lock().unwrap();

        if let Some(info) = webviews.get_mut(webview_id) {
            info.z_order = *z_order;
            *z_order += 1;
        }
    }

    /// Get WebView labels sorted by z-order (front to back).
    pub fn get_labels_by_z_order(&self) -> Vec<String> {
        let webviews = self.webviews.lock().unwrap();
        let mut entries: Vec<_> = webviews.iter().collect();
        entries.sort_by(|a, b| b.1.z_order.cmp(&a.1.z_order)); // Descending order
        entries.into_iter().map(|(k, _)| k.clone()).collect()
    }

    /// Get count of registered WebViews.
    pub fn count(&self) -> usize {
        let webviews = self.webviews.lock().unwrap();
        webviews.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_browser_webview_bounds_validation() {
        let valid = BrowserWebViewBounds {
            x: 100.0,
            y: 100.0,
            width: 800.0,
            height: 600.0,
        };
        assert!(valid.is_valid());

        let invalid_width = BrowserWebViewBounds {
            x: 100.0,
            y: 100.0,
            width: 0.0,
            height: 600.0,
        };
        assert!(!invalid_width.is_valid());

        let negative_x = BrowserWebViewBounds {
            x: -10.0,
            y: 100.0,
            width: 800.0,
            height: 600.0,
        };
        assert!(!negative_x.is_valid());
    }

    #[test]
    fn test_browser_webview_state_register_unregister() {
        let state = BrowserWebViewState::new();

        state.register("webview-1", "window-1", "https://example.com", 1.0);
        assert_eq!(state.count(), 1);

        state.register("webview-2", "window-2", "https://google.com", 1.5);
        assert_eq!(state.count(), 2);

        let info = state.unregister("webview-1");
        assert!(info.is_some());
        assert_eq!(state.count(), 1);

        let info = state.unregister("webview-nonexistent");
        assert!(info.is_none());
    }

    #[test]
    fn test_browser_webview_state_get_by_window_id() {
        let state = BrowserWebViewState::new();

        state.register("webview-abc", "window-123", "https://example.com", 1.0);

        let webview_id = state.get_by_window_id("window-123");
        assert_eq!(webview_id, Some("webview-abc".to_string()));

        let webview_id = state.get_by_window_id("window-nonexistent");
        assert_eq!(webview_id, None);
    }

    #[test]
    fn test_browser_webview_state_z_order() {
        let state = BrowserWebViewState::new();

        state.register("webview-1", "window-1", "https://example.com", 1.0);
        state.register("webview-2", "window-2", "https://google.com", 1.0);
        state.register("webview-3", "window-3", "https://github.com", 1.0);

        // Initially, webview-3 should be on top
        let labels = state.get_labels_by_z_order();
        assert_eq!(labels[0], "webview-3");

        // Bring webview-1 to front
        state.bring_to_front("webview-1");
        let labels = state.get_labels_by_z_order();
        assert_eq!(labels[0], "webview-1");
    }
}
