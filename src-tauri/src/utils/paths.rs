use std::fs;
use std::path::PathBuf;

pub fn app_data_dir() -> PathBuf {
    let dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("OpenScreenPlace");
    fs::create_dir_all(&dir).ok();
    dir
}

pub fn recordings_dir() -> PathBuf {
    let dir = app_data_dir().join("recordings");
    fs::create_dir_all(&dir).ok();
    dir
}

pub fn projects_dir() -> PathBuf {
    let dir = app_data_dir().join("projects");
    fs::create_dir_all(&dir).ok();
    dir
}

pub fn exports_dir() -> PathBuf {
    let dir = dirs::video_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_else(|| PathBuf::from(".")))
        .join("OpenScreenPlace");
    fs::create_dir_all(&dir).ok();
    dir
}

pub fn project_dir(project_id: &str) -> PathBuf {
    let dir = projects_dir().join(project_id);
    fs::create_dir_all(&dir).ok();
    dir
}

pub fn project_video_path(project_id: &str) -> PathBuf {
    project_dir(project_id).join("recording.mp4")
}

pub fn project_events_path(project_id: &str) -> PathBuf {
    project_dir(project_id).join("events.json")
}

pub fn project_metadata_path(project_id: &str) -> PathBuf {
    project_dir(project_id).join("project.json")
}
