use core_graphics::event::{
    CGEvent, CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement, CGEventType,
};
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
use core_foundation::runloop::{CFRunLoop, kCFRunLoopCommonModes, kCFRunLoopDefaultMode};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use crate::models::events::{EventType, MouseButton, MouseEvent, RecordedEvents};

/// Records mouse events using CGEventTap.
/// Runs on a background thread and collects events into a shared buffer.
pub struct EventRecorder {
    events: Arc<Mutex<RecordedEvents>>,
    is_recording: Arc<AtomicBool>,
    start_time: Option<Instant>,
}

impl EventRecorder {
    pub fn new(display_width: f64, display_height: f64) -> Self {
        Self {
            events: Arc::new(Mutex::new(RecordedEvents::new(display_width, display_height))),
            is_recording: Arc::new(AtomicBool::new(false)),
            start_time: None,
        }
    }

    /// Start recording mouse events.
    /// Spawns a background thread with a CGEventTap.
    pub fn start(&mut self) -> Result<(), String> {
        if self.is_recording.load(Ordering::SeqCst) {
            return Err("Already recording events".to_string());
        }

        let start = Instant::now();
        self.start_time = Some(start);
        self.is_recording.store(true, Ordering::SeqCst);

        // Clear previous events
        if let Ok(mut events) = self.events.lock() {
            events.mouse_events.clear();
            events.recording_start_ms = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64;
        }

        let events = Arc::clone(&self.events);
        let is_recording = Arc::clone(&self.is_recording);

        std::thread::spawn(move || {
            Self::run_event_tap(events, is_recording, start);
        });

        log::info!("Event recording started");
        Ok(())
    }

    /// Stop recording and return collected events
    pub fn stop(&mut self) -> Result<RecordedEvents, String> {
        self.is_recording.store(false, Ordering::SeqCst);
        self.start_time = None;

        let events = self
            .events
            .lock()
            .map_err(|e| format!("Failed to get events: {}", e))?
            .clone();

        log::info!(
            "Event recording stopped: {} events captured",
            events.mouse_events.len()
        );
        Ok(events)
    }

    fn run_event_tap(
        events: Arc<Mutex<RecordedEvents>>,
        is_recording: Arc<AtomicBool>,
        start_time: Instant,
    ) {
        let events_of_interest = vec![
            CGEventType::LeftMouseDown,
            CGEventType::LeftMouseUp,
            CGEventType::RightMouseDown,
            CGEventType::RightMouseUp,
            CGEventType::MouseMoved,
            CGEventType::ScrollWheel,
            CGEventType::LeftMouseDragged,
            CGEventType::RightMouseDragged,
        ];

        // Clone for the closure so we can still use originals in the fallback
        let events_for_tap = Arc::clone(&events);
        let is_recording_for_tap = Arc::clone(&is_recording);

        let tap = CGEventTap::new(
            CGEventTapLocation::HID,
            CGEventTapPlacement::HeadInsertEventTap,
            CGEventTapOptions::ListenOnly,
            events_of_interest,
            |_proxy, event_type, event| {
                if !is_recording_for_tap.load(Ordering::SeqCst) {
                    return None;
                }

                let location = event.location();
                let timestamp_ms = start_time.elapsed().as_millis() as u64;

                let (evt_type, button) = match event_type {
                    CGEventType::LeftMouseDown => (EventType::Click, MouseButton::Left),
                    CGEventType::RightMouseDown => (EventType::Click, MouseButton::Right),
                    CGEventType::MouseMoved
                    | CGEventType::LeftMouseDragged
                    | CGEventType::RightMouseDragged => (EventType::Move, MouseButton::Other),
                    CGEventType::ScrollWheel => (EventType::Scroll, MouseButton::Other),
                    _ => return None,
                };

                let mouse_event = MouseEvent {
                    timestamp_ms,
                    x: location.x,
                    y: location.y,
                    event_type: evt_type,
                    button,
                };

                if let Ok(mut evts) = events_for_tap.lock() {
                    evts.mouse_events.push(mouse_event);
                }

                None // Don't modify the event
            },
        );

        match tap {
            Ok(tap) => unsafe {
                let loop_source = tap
                    .mach_port
                    .create_runloop_source(0)
                    .expect("Failed to create run loop source");

                let current_loop = CFRunLoop::get_current();
                current_loop.add_source(&loop_source, kCFRunLoopCommonModes);
                tap.enable();

                // Run until recording stops
                while is_recording.load(Ordering::SeqCst) {
                    CFRunLoop::run_in_mode(
                        kCFRunLoopDefaultMode,
                        Duration::from_millis(100),
                        false,
                    );
                }
            },
            Err(()) => {
                log::error!(
                    "Failed to create CGEventTap. Accessibility permission may be required."
                );
                // Fall back to polling mouse position
                Self::run_polling_fallback(events, is_recording, start_time);
            }
        }
    }

    /// Fallback: poll mouse position if CGEventTap isn't available
    fn run_polling_fallback(
        events: Arc<Mutex<RecordedEvents>>,
        is_recording: Arc<AtomicBool>,
        start_time: Instant,
    ) {
        log::info!("Using polling fallback for mouse tracking");

        while is_recording.load(Ordering::SeqCst) {
            let source = CGEventSource::new(CGEventSourceStateID::CombinedSessionState);
            let cg_event = match source {
                Ok(src) => CGEvent::new(src),
                Err(_) => {
                    std::thread::sleep(Duration::from_millis(16));
                    continue;
                }
            };

            if let Ok(event) = cg_event {
                let location = event.location();
                let timestamp_ms = start_time.elapsed().as_millis() as u64;

                let mouse_event = MouseEvent {
                    timestamp_ms,
                    x: location.x,
                    y: location.y,
                    event_type: EventType::Move,
                    button: MouseButton::Other,
                };

                if let Ok(mut evts) = events.lock() {
                    // Only record every ~16ms (60fps) to avoid flooding
                    if let Some(last) = evts.mouse_events.last() {
                        if timestamp_ms - last.timestamp_ms < 16 {
                            std::thread::sleep(Duration::from_millis(8));
                            continue;
                        }
                    }
                    evts.mouse_events.push(mouse_event);
                }
            }

            std::thread::sleep(Duration::from_millis(16));
        }
    }
}
