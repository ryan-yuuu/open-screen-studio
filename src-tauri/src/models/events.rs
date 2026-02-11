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

#[cfg(test)]
mod tests {
    use super::*;

    fn make_event(event_type: EventType) -> MouseEvent {
        MouseEvent {
            timestamp_ms: 100,
            x: 0.0,
            y: 0.0,
            event_type,
            button: MouseButton::Left,
        }
    }

    #[test]
    fn test_click_events_filters_correctly() {
        let events = RecordedEvents {
            mouse_events: vec![
                make_event(EventType::Click),
                make_event(EventType::Move),
                make_event(EventType::Scroll),
                make_event(EventType::Click),
                make_event(EventType::Move),
            ],
            recording_start_ms: 0,
            display_width: 1920.0,
            display_height: 1080.0,
        };

        let clicks = events.click_events();
        assert_eq!(clicks.len(), 2);
        for click in &clicks {
            assert!(matches!(click.event_type, EventType::Click));
        }
    }

    #[test]
    fn test_click_events_empty() {
        let events = RecordedEvents {
            mouse_events: vec![
                make_event(EventType::Move),
                make_event(EventType::Scroll),
            ],
            recording_start_ms: 0,
            display_width: 1920.0,
            display_height: 1080.0,
        };

        assert!(events.click_events().is_empty());
    }
}
