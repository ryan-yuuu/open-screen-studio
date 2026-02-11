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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_project_video_path_contains_id() {
        let path = project_video_path("abc-123");
        let path_str = path.to_string_lossy();
        assert!(path_str.contains("abc-123"), "Path should contain project ID: {path_str}");
        assert!(path_str.ends_with("recording.mp4"));
    }

    #[test]
    fn test_project_events_path_contains_id() {
        let path = project_events_path("abc-123");
        let path_str = path.to_string_lossy();
        assert!(path_str.contains("abc-123"), "Path should contain project ID: {path_str}");
        assert!(path_str.ends_with("events.json"));
    }

    #[test]
    fn test_project_metadata_path_contains_id() {
        let path = project_metadata_path("abc-123");
        let path_str = path.to_string_lossy();
        assert!(path_str.contains("abc-123"), "Path should contain project ID: {path_str}");
        assert!(path_str.ends_with("project.json"));
    }
}
