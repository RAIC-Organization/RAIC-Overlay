// T010: Build script to validate TARGET_WINDOW_NAME env var exists and pass it to Rust code
// T002-T003: Extended to embed VITE_DEBUG_BORDER and RAIC_LOG_LEVEL at compile time
fn main() {
    // Validate TARGET_WINDOW_NAME is set at build time (required)
    let target_window_name = std::env::var("TARGET_WINDOW_NAME")
        .expect("TARGET_WINDOW_NAME environment variable must be set at build time");

    // Pass to Rust code via cargo:rustc-env
    println!("cargo:rustc-env=TARGET_WINDOW_NAME={}", target_window_name);

    // VITE_DEBUG_BORDER (optional, default: false)
    let debug_border = std::env::var("VITE_DEBUG_BORDER").unwrap_or_else(|_| "false".to_string());
    println!("cargo:rustc-env=VITE_DEBUG_BORDER={}", debug_border);

    // RAIC_LOG_LEVEL (optional, default: WARN)
    let log_level = std::env::var("RAIC_LOG_LEVEL").unwrap_or_else(|_| "WARN".to_string());
    println!("cargo:rustc-env=RAIC_LOG_LEVEL={}", log_level);

    // Rerun if any env var changes
    println!("cargo:rerun-if-env-changed=TARGET_WINDOW_NAME");
    println!("cargo:rerun-if-env-changed=VITE_DEBUG_BORDER");
    println!("cargo:rerun-if-env-changed=RAIC_LOG_LEVEL");

    // Run tauri build
    tauri_build::build()
}
