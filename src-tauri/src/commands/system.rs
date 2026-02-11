use crate::capture::screen;
use crate::models::project::DisplayInfo;

#[tauri::command]
pub fn get_displays() -> Result<Vec<DisplayInfo>, String> {
    screen::get_displays()
}

#[tauri::command]
pub fn check_permissions() -> Result<bool, String> {
    Ok(screen::check_screen_recording_permission())
}

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
