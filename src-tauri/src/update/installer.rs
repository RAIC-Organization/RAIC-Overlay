//! T023-T024 (049): Installer launcher
//! @see specs/049-auto-update/research.md

use super::state::get_downloads_dir;
use std::path::PathBuf;
use std::process::Command;

/// T023-T024: Launch the MSI installer and exit the application.
///
/// The installer is spawned as a detached process so it can continue
/// running after this application exits. On Windows, we use msiexec
/// to run the installer with /passive flag for minimal UI.
#[tauri::command]
pub async fn launch_installer_and_exit(
    app: tauri::AppHandle,
    installer_path: String,
) -> Result<(), String> {
    log::info!("Preparing to launch installer: {}", installer_path);

    // Validate path is in app data directory (security check)
    let downloads_dir = get_downloads_dir(&app)?;
    let installer = PathBuf::from(&installer_path);

    if !installer.starts_with(&downloads_dir) {
        log::error!("Security check failed: installer not in app data directory");
        return Err("Invalid installer path: not in app data directory".to_string());
    }

    // Check file exists
    if !installer.exists() {
        log::error!("Installer file not found: {}", installer_path);
        return Err("Installer file not found".to_string());
    }

    // Check it's an MSI file
    if installer.extension().map(|e| e.to_str()) != Some(Some("msi")) {
        log::error!("Not an MSI file: {}", installer_path);
        return Err("Not an MSI installer file".to_string());
    }

    log::info!("Launching installer: {}", installer_path);

    // Launch msiexec with the installer
    // /passive gives a progress bar but no user prompts
    // /norestart prevents automatic restart (user can restart manually)
    // AUTOLAUNCHAPP=1 triggers the app to launch after installation completes
    #[cfg(windows)]
    {
        match Command::new("msiexec")
            .args(["/i", &installer_path, "/passive", "/norestart", "AUTOLAUNCHAPP=1"])
            .spawn()
        {
            Ok(_child) => {
                log::info!("Installer launched successfully, exiting application");
                // Give the installer a moment to start
                std::thread::sleep(std::time::Duration::from_millis(500));
                // Exit the application
                std::process::exit(0);
            }
            Err(e) => {
                log::error!("Failed to launch installer: {}", e);
                Err(format!("Failed to launch installer: {}", e))
            }
        }
    }

    #[cfg(not(windows))]
    {
        log::error!("MSI installer only supported on Windows");
        Err("MSI installers are only supported on Windows".to_string())
    }
}
