use std::sync::Mutex;
use tauri::State;

use crate::capture::session::RecordingSession;
use crate::models::project::{DisplayInfo, Project, RecordingState};

pub struct RecordingSessionState(pub Mutex<RecordingSession>);

#[tauri::command]
pub fn start_recording(
    display: DisplayInfo,
    session: State<'_, RecordingSessionState>,
) -> Result<String, String> {
    let mut session = session
        .0
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    session.start(display)
}

#[tauri::command]
pub fn stop_recording(
    session: State<'_, RecordingSessionState>,
) -> Result<Project, String> {
    let mut session = session
        .0
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    session.stop()
}

#[tauri::command]
pub fn get_recording_state(
    session: State<'_, RecordingSessionState>,
) -> Result<RecordingState, String> {
    let session = session
        .0
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    Ok(session.get_state())
}

#[tauri::command]
pub fn get_recording_duration(
    session: State<'_, RecordingSessionState>,
) -> Result<u64, String> {
    let session = session
        .0
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    Ok(session.elapsed_ms())
}
