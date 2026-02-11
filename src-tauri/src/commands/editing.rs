use crate::models::effects::{FrameStyle, ZoomConfig};
use crate::models::events::RecordedEvents;
use crate::models::project::Project;
use crate::utils::paths;

#[tauri::command]
pub fn load_project(project_id: String) -> Result<Project, String> {
    let path = paths::project_metadata_path(&project_id);
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read project: {}", e))?;
    let project: Project = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse project: {}", e))?;
    Ok(project)
}

#[tauri::command]
pub fn load_events(project_id: String) -> Result<RecordedEvents, String> {
    let path = paths::project_events_path(&project_id);
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read events: {}", e))?;
    let events: RecordedEvents = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse events: {}", e))?;
    Ok(events)
}

#[tauri::command]
pub fn save_project(project: Project) -> Result<(), String> {
    let path = paths::project_metadata_path(&project.id);
    let json = serde_json::to_string_pretty(&project)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    std::fs::write(&path, json)
        .map_err(|e| format!("Failed to write project: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn update_zoom_config(project_id: String, zoom_config: ZoomConfig) -> Result<(), String> {
    let mut project = load_project(project_id)?;
    project.zoom_config = zoom_config;
    save_project(project)
}

#[tauri::command]
pub fn update_frame_style(project_id: String, frame_style: FrameStyle) -> Result<(), String> {
    let mut project = load_project(project_id)?;
    project.frame_style = frame_style;
    save_project(project)
}

#[tauri::command]
pub fn list_projects() -> Result<Vec<Project>, String> {
    let dir = paths::projects_dir();
    let mut projects = Vec::new();

    let entries = std::fs::read_dir(&dir)
        .map_err(|e| format!("Failed to read projects dir: {}", e))?;

    for entry in entries.flatten() {
        if entry.path().is_dir() {
            let meta_path = entry.path().join("project.json");
            if meta_path.exists() {
                if let Ok(content) = std::fs::read_to_string(&meta_path) {
                    if let Ok(project) = serde_json::from_str::<Project>(&content) {
                        projects.push(project);
                    }
                }
            }
        }
    }

    // Sort by creation time, newest first
    projects.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(projects)
}

#[tauri::command]
pub fn delete_project(project_id: String) -> Result<(), String> {
    let dir = paths::project_dir(&project_id);
    std::fs::remove_dir_all(&dir)
        .map_err(|e| format!("Failed to delete project: {}", e))?;
    Ok(())
}
