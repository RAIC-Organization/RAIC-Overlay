// Core module - foundational types, state, and window utilities
// This module has NO external dependencies - all other modules depend on this

pub mod state;
pub mod types;
pub mod window;

// Re-exports for convenient access
pub use state::OverlayState;
pub use types::*;
pub use window::*;
