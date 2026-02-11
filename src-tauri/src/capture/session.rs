use std::sync::{Arc, Mutex};
use std::time::Instant;

use crate::capture::events::EventRecorder;
use crate::capture::screen::ScreenRecorder;
use crate::models::events::RecordedEvents;
use crate::models::project::{DisplayInfo, Project, RecordingState};
use crate::utils::paths;

/// Manages the lifecycle of a recording session.
/// Coordinates screen capture and event recording.
pub struct RecordingSession {
    state: Arc<Mutex<RecordingState>>,
    screen_recorder: Option<ScreenRecorder>,
    event_recorder: Option<EventRecorder>,
    start_time: Option<Instant>,
    current_display: Option<DisplayInfo>,
    current_project_id: Option<String>,
}

impl RecordingSession {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(RecordingState::default())),
            screen_recorder: None,
            event_recorder: None,
            start_time: None,
            current_display: None,
            current_project_id: None,
        }
    }

    pub fn get_state(&self) -> RecordingState {
        self.state.lock().unwrap_or_else(|e| e.into_inner()).clone()
    }

    /// Start a new recording session
    pub fn start(&mut self, display: DisplayInfo) -> Result<String, String> {
        let state = self.get_state();
        if state.is_recording {
            return Err("Already recording".to_string());
        }

        let project_id = uuid::Uuid::new_v4().to_string();
        let video_path = paths::project_video_path(&project_id);

        // Ensure project directory exists
        let _ = std::fs::create_dir_all(paths::project_dir(&project_id));

        // Initialize screen recorder
        let mut screen_recorder = ScreenRecorder::new(video_path, display.id);
        screen_recorder.start()?;

        // Initialize event recorder
        let mut event_recorder =
            EventRecorder::new(display.width as f64, display.height as f64);
        event_recorder.start()?;

        self.screen_recorder = Some(screen_recorder);
        self.event_recorder = Some(event_recorder);
        self.start_time = Some(Instant::now());
        self.current_display = Some(display);
        self.current_project_id = Some(project_id.clone());

        // Update state
        if let Ok(mut s) = self.state.lock() {
            s.is_recording = true;
            s.is_paused = false;
            s.duration_ms = 0;
            s.project_id = Some(project_id.clone());
        }

        log::info!("Recording session started: {}", project_id);
        Ok(project_id)
    }

    /// Stop the current recording session and save the project
    pub fn stop(&mut self) -> Result<Project, String> {
        let state = self.get_state();
        if !state.is_recording {
            return Err("Not recording".to_string());
        }

        let project_id = self
            .current_project_id
            .clone()
            .ok_or("No active project")?;
        let display = self.current_display.clone().ok_or("No display info")?;

        // Stop screen recording
        let video_path = if let Some(ref mut recorder) = self.screen_recorder {
            recorder.stop()?
        } else {
            return Err("No screen recorder".to_string());
        };

        // Stop event recording
        let events = if let Some(ref mut recorder) = self.event_recorder {
            recorder.stop()?
        } else {
            RecordedEvents::default()
        };

        let duration_ms = self
            .start_time
            .map(|t| t.elapsed().as_millis() as u64)
            .unwrap_or(0);

        // Save events to JSON
        let events_path = paths::project_events_path(&project_id);
        let events_json = serde_json::to_string_pretty(&events)
            .map_err(|e| format!("Failed to serialize events: {}", e))?;
        std::fs::write(&events_path, events_json)
            .map_err(|e| format!("Failed to write events: {}", e))?;

        // Create project
        let mut project = Project::new(
            project_id.clone(),
            format!("Recording {}", chrono_like_now()),
            video_path.to_string_lossy().to_string(),
            events_path.to_string_lossy().to_string(),
            display.width,
            display.height,
            60.0,
        );
        project.duration_ms = duration_ms;

        // Save project metadata
        let project_json = serde_json::to_string_pretty(&project)
            .map_err(|e| format!("Failed to serialize project: {}", e))?;
        std::fs::write(paths::project_metadata_path(&project_id), project_json)
            .map_err(|e| format!("Failed to write project: {}", e))?;

        // Reset state
        self.screen_recorder = None;
        self.event_recorder = None;
        self.start_time = None;
        self.current_display = None;
        self.current_project_id = None;

        if let Ok(mut s) = self.state.lock() {
            *s = RecordingState::default();
        }

        log::info!(
            "Recording session stopped: {} ({}ms, {} events)",
            project_id,
            duration_ms,
            events.mouse_events.len()
        );

        Ok(project)
    }

    /// Get the current recording duration in ms
    pub fn elapsed_ms(&self) -> u64 {
        self.start_time
            .map(|t| t.elapsed().as_millis() as u64)
            .unwrap_or(0)
    }
}

fn chrono_like_now() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = now.as_secs();
    // Simple date-time string
    let hours = (secs / 3600) % 24;
    let minutes = (secs / 60) % 60;
    let seconds = secs % 60;
    format!("{:02}:{:02}:{:02}", hours, minutes, seconds)
}
