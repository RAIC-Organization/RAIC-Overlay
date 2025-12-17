// T010: Build script to validate TARGET_WINDOW_NAME env var exists and pass it to Rust code
fn main() {
    // Validate TARGET_WINDOW_NAME is set at build time
    let target_window_name = std::env::var("TARGET_WINDOW_NAME")
        .expect("TARGET_WINDOW_NAME environment variable must be set at build time");

    // Pass to Rust code via cargo:rustc-env
    println!("cargo:rustc-env=TARGET_WINDOW_NAME={}", target_window_name);

    // Rerun if env changes
    println!("cargo:rerun-if-env-changed=TARGET_WINDOW_NAME");

    // Run tauri build
    tauri_build::build()
}
