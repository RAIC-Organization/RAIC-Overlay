// T010: Build script to validate TARGET_WINDOW_NAME env var exists and pass it to Rust code
// T002-T003: Extended to embed VITE_DEBUG_BORDER and RAIC_LOG_LEVEL at compile time
// T001 (043): Added get_env_or_default() helper for optional env vars with defaults
// T002-T006 (043): Made TARGET_WINDOW_NAME optional, added TARGET_PROCESS_NAME and TARGET_WINDOW_CLASS

/// Get an environment variable value, filtering empty/whitespace strings.
/// Returns a tuple of (value, from_env) where from_env indicates if the value came from environment.
fn get_env_or_default(var_name: &str, default: &str) -> (String, bool) {
    match std::env::var(var_name) {
        Ok(value) if !value.trim().is_empty() => (value, true),
        _ => (default.to_string(), false),
    }
}

fn main() {
    // TARGET_WINDOW_NAME (optional, default: "Star Citizen")
    let (target_window_name, target_window_name_from_env) =
        get_env_or_default("TARGET_WINDOW_NAME", "Star Citizen");
    println!("cargo:rustc-env=TARGET_WINDOW_NAME={}", target_window_name);

    // TARGET_PROCESS_NAME (optional, default: "StarCitizen.exe")
    let (target_process_name, target_process_name_from_env) =
        get_env_or_default("TARGET_PROCESS_NAME", "StarCitizen.exe");
    println!(
        "cargo:rustc-env=TARGET_PROCESS_NAME={}",
        target_process_name
    );

    // TARGET_WINDOW_CLASS (optional, default: "CryENGINE")
    let (target_window_class, target_window_class_from_env) =
        get_env_or_default("TARGET_WINDOW_CLASS", "CryENGINE");
    println!("cargo:rustc-env=TARGET_WINDOW_CLASS={}", target_window_class);

    // VITE_DEBUG_BORDER (optional, default: false)
    let debug_border = std::env::var("VITE_DEBUG_BORDER").unwrap_or_else(|_| "false".to_string());
    println!("cargo:rustc-env=VITE_DEBUG_BORDER={}", debug_border);

    // RAIC_LOG_LEVEL (optional, default: WARN)
    let log_level = std::env::var("RAIC_LOG_LEVEL").unwrap_or_else(|_| "WARN".to_string());
    println!("cargo:rustc-env=RAIC_LOG_LEVEL={}", log_level);

    // Rerun if any env var changes
    println!("cargo:rerun-if-env-changed=TARGET_WINDOW_NAME");
    println!("cargo:rerun-if-env-changed=TARGET_PROCESS_NAME");
    println!("cargo:rerun-if-env-changed=TARGET_WINDOW_CLASS");
    println!("cargo:rerun-if-env-changed=VITE_DEBUG_BORDER");
    println!("cargo:rerun-if-env-changed=RAIC_LOG_LEVEL");

    // T006 (043): Build configuration logging
    println!("cargo:warning=Build configuration:");
    println!(
        "cargo:warning=  TARGET_WINDOW_NAME: {} ({})",
        target_window_name,
        if target_window_name_from_env {
            "env"
        } else {
            "default"
        }
    );
    println!(
        "cargo:warning=  TARGET_PROCESS_NAME: {} ({})",
        target_process_name,
        if target_process_name_from_env {
            "env"
        } else {
            "default"
        }
    );
    println!(
        "cargo:warning=  TARGET_WINDOW_CLASS: {} ({})",
        target_window_class,
        if target_window_class_from_env {
            "env"
        } else {
            "default"
        }
    );

    // Run tauri build
    tauri_build::build()
}
