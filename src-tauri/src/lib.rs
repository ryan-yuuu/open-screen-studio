mod capture;
mod commands;
mod models;
mod processing;
mod utils;

use commands::recording::RecordingSessionState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(RecordingSessionState(std::sync::Mutex::new(
            capture::session::RecordingSession::new(),
        )))
        .invoke_handler(tauri::generate_handler![
            // System
            commands::system::get_displays,
            commands::system::check_permissions,
            commands::system::get_app_version,
            // Recording
            commands::recording::start_recording,
            commands::recording::stop_recording,
            commands::recording::get_recording_state,
            commands::recording::get_recording_duration,
            // Editing
            commands::editing::load_project,
            commands::editing::load_events,
            commands::editing::save_project,
            commands::editing::update_zoom_config,
            commands::editing::update_frame_style,
            commands::editing::list_projects,
            commands::editing::delete_project,
            // Export
            commands::export::export_project,
            commands::export::get_video_duration,
            commands::export::check_ffmpeg,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
