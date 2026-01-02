//! T008 (049): Auto-update module
//! @see specs/049-auto-update/plan.md

pub mod checker;
pub mod downloader;
pub mod installer;
pub mod state;
pub mod types;

// Re-export all items from submodules for Tauri command registration
// This includes both the public functions and the #[tauri::command] generated items
pub use checker::*;
pub use downloader::*;
pub use installer::*;
pub use state::*;
