use tauri::{Emitter, AppHandle};

use crate::commands::editing::load_project;
use crate::models::effects::ExportConfig;
use crate::processing::encoder;

#[tauri::command]
pub async fn export_project(
    app: AppHandle,
    project_id: String,
    config: ExportConfig,
) -> Result<String, String> {
    let project = load_project(project_id)?;

    let app_handle = app.clone();
    let result = tokio::task::spawn_blocking(move || {
        encoder::export_project(&project, &config, move |progress| {
            let _ = app_handle.emit("export-progress", progress);
        })
    })
    .await
    .map_err(|e| format!("Export task failed: {}", e))?;

    let output_path = result?;

    let _ = app.emit("export-complete", &output_path);
    Ok(output_path)
}

#[tauri::command]
pub fn get_video_duration(video_path: String) -> Result<u64, String> {
    encoder::get_video_duration_ms(&video_path)
}

#[tauri::command]
pub fn check_ffmpeg() -> Result<bool, String> {
    // Try to find ffmpeg
    let result = std::process::Command::new("ffmpeg")
        .arg("-version")
        .output();

    match result {
        Ok(output) => Ok(output.status.success()),
        Err(_) => {
            // Try homebrew path
            let result = std::process::Command::new("/opt/homebrew/bin/ffmpeg")
                .arg("-version")
                .output();
            match result {
                Ok(output) => Ok(output.status.success()),
                Err(_) => Ok(false),
            }
        }
    }
}
