//! T008 (049): Auto-update module
//! @see specs/049-auto-update/plan.md
//! @feature 051-fix-update-popup

pub mod checker;
pub mod downloader;
pub mod installer;
pub mod state;
pub mod types;
// T008 (051): Update window management module
pub mod window;

// Re-export all items from submodules for Tauri command registration
// This includes both the public functions and the #[tauri::command] generated items
pub use checker::*;
pub use downloader::*;
pub use installer::*;
pub use state::*;
// T008 (051): Re-export window commands
pub use window::*;
