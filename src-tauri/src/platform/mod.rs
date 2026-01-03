// Platform module - Windows-specific functionality

#[cfg(windows)]
pub mod keyboard_hook;
#[cfg(windows)]
pub mod target_window;
#[cfg(windows)]
pub mod process_monitor;
#[cfg(windows)]
pub mod focus_monitor;

pub mod tray;

// Re-exports for public API
#[cfg(windows)]
pub use keyboard_hook::*;
#[cfg(windows)]
pub use target_window::*;
#[cfg(windows)]
pub use process_monitor::*;
#[cfg(windows)]
pub use focus_monitor::*;
pub use tray::*;
