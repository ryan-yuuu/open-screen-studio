use serde::{Deserialize, Serialize};

use super::effects::{CursorConfig, ExportConfig, FrameStyle, ZoomConfig};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub created_at: u64,
    pub video_path: String,
    pub events_path: String,
    pub duration_ms: u64,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub zoom_config: ZoomConfig,
    pub cursor_config: CursorConfig,
    pub frame_style: FrameStyle,
    pub export_config: ExportConfig,
}

impl Project {
    pub fn new(
        id: String,
        name: String,
        video_path: String,
        events_path: String,
        width: u32,
        height: u32,
        fps: f64,
    ) -> Self {
        Self {
            id,
            name,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64,
            video_path,
            events_path,
            duration_ms: 0,
            width,
            height,
            fps,
            zoom_config: ZoomConfig::default(),
            cursor_config: CursorConfig::default(),
            frame_style: FrameStyle::default(),
            export_config: ExportConfig::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSummary {
    pub id: String,
    pub name: String,
    pub created_at: u64,
    pub duration_ms: u64,
    pub thumbnail_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayInfo {
    pub id: u32,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub is_primary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingState {
    pub is_recording: bool,
    pub is_paused: bool,
    pub duration_ms: u64,
    pub project_id: Option<String>,
}

impl Default for RecordingState {
    fn default() -> Self {
        Self {
            is_recording: false,
            is_paused: false,
            duration_ms: 0,
            project_id: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_project_new_defaults() {
        let project = Project::new(
            "test-123".to_string(),
            "My Recording".to_string(),
            "/tmp/video.mp4".to_string(),
            "/tmp/events.json".to_string(),
            1920,
            1080,
            30.0,
        );

        assert_eq!(project.id, "test-123");
        assert_eq!(project.name, "My Recording");
        assert_eq!(project.width, 1920);
        assert_eq!(project.height, 1080);
        assert!((project.fps - 30.0).abs() < 1e-10);
        assert_eq!(project.duration_ms, 0);
        assert!(project.zoom_config.enabled);
    }

    #[test]
    fn test_project_new_created_at_nonzero() {
        let project = Project::new(
            "test".to_string(),
            "Test".to_string(),
            "".to_string(),
            "".to_string(),
            100,
            100,
            30.0,
        );
        assert!(project.created_at > 0, "created_at should be a real timestamp");
    }
}
