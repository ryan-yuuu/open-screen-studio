use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventType {
    Click,
    Move,
    Scroll,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MouseButton {
    Left,
    Right,
    Middle,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MouseEvent {
    /// Milliseconds since recording start
    pub timestamp_ms: u64,
    /// Screen X coordinate
    pub x: f64,
    /// Screen Y coordinate
    pub y: f64,
    pub event_type: EventType,
    pub button: MouseButton,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RecordedEvents {
    pub mouse_events: Vec<MouseEvent>,
    pub recording_start_ms: u64,
    pub display_width: f64,
    pub display_height: f64,
}

impl RecordedEvents {
    pub fn new(display_width: f64, display_height: f64) -> Self {
        Self {
            mouse_events: Vec::new(),
            recording_start_ms: 0,
            display_width,
            display_height,
        }
    }

    pub fn click_events(&self) -> Vec<&MouseEvent> {
        self.mouse_events
            .iter()
            .filter(|e| matches!(e.event_type, EventType::Click))
            .collect()
    }
}
