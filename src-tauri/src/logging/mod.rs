// Logging module - log configuration, cleanup, and utilities

pub mod types;
pub mod cleanup;

// Re-exports for public API
pub use cleanup::*;
pub use types::*;
