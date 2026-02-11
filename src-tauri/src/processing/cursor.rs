use crate::models::effects::CursorConfig;
use crate::models::events::{EventType, MouseEvent};

/// Smoothed cursor position at a given time
#[derive(Debug, Clone)]
pub struct CursorState {
    pub x: f64,
    pub y: f64,
    pub visible: bool,
    pub click_highlight: Option<ClickHighlight>,
}

#[derive(Debug, Clone)]
pub struct ClickHighlight {
    /// 0.0 to 1.0 animation progress
    pub progress: f64,
    pub x: f64,
    pub y: f64,
}

/// Apply cursor smoothing using a simple moving average over nearby events
pub fn get_cursor_at_time(
    time_ms: u64,
    events: &[MouseEvent],
    config: &CursorConfig,
) -> CursorState {
    if events.is_empty() {
        return CursorState {
            x: 0.0,
            y: 0.0,
            visible: false,
            click_highlight: None,
        };
    }

    // Find the events around this timestamp
    let idx = events
        .binary_search_by_key(&time_ms, |e| e.timestamp_ms)
        .unwrap_or_else(|i| i.min(events.len() - 1));

    // Get the raw position from the nearest event
    let nearest = &events[idx];

    // Apply smoothing: average nearby positions
    let smoothing_window_ms = (config.smoothing * 100.0) as u64;
    let (smooth_x, smooth_y) = if config.smoothing > 0.01 {
        smooth_position(events, idx, time_ms, smoothing_window_ms)
    } else {
        (nearest.x, nearest.y)
    };

    // Check if cursor should be visible (auto-hide after inactivity)
    let visible = check_cursor_visible(events, idx, time_ms, config.auto_hide_after_ms);

    // Check for click highlight animation
    let click_highlight = if config.highlight_clicks {
        get_click_highlight(events, time_ms)
    } else {
        None
    };

    CursorState {
        x: smooth_x,
        y: smooth_y,
        visible,
        click_highlight,
    }
}

fn smooth_position(
    events: &[MouseEvent],
    center_idx: usize,
    _time_ms: u64,
    window_ms: u64,
) -> (f64, f64) {
    if events.is_empty() {
        return (0.0, 0.0);
    }

    let center = &events[center_idx];
    let center_time = center.timestamp_ms;

    let mut sum_x = 0.0;
    let mut sum_y = 0.0;
    let mut weight_sum = 0.0;

    // Look at events within the smoothing window
    for event in events.iter() {
        let dt = if event.timestamp_ms > center_time {
            event.timestamp_ms - center_time
        } else {
            center_time - event.timestamp_ms
        };

        if dt > window_ms {
            continue;
        }

        // Gaussian-like weight: closer events have more influence
        let weight = 1.0 - (dt as f64 / window_ms as f64);
        let weight = weight * weight; // quadratic falloff

        sum_x += event.x * weight;
        sum_y += event.y * weight;
        weight_sum += weight;
    }

    if weight_sum > 0.0 {
        (sum_x / weight_sum, sum_y / weight_sum)
    } else {
        (center.x, center.y)
    }
}

fn check_cursor_visible(
    events: &[MouseEvent],
    idx: usize,
    time_ms: u64,
    auto_hide_after_ms: u64,
) -> bool {
    // Find the last move/click event before this time
    let last_active = events[..=idx]
        .iter()
        .rev()
        .find(|e| matches!(e.event_type, EventType::Click | EventType::Move));

    match last_active {
        Some(event) => (time_ms - event.timestamp_ms) < auto_hide_after_ms,
        None => false,
    }
}

fn get_click_highlight(events: &[MouseEvent], time_ms: u64) -> Option<ClickHighlight> {
    let highlight_duration_ms = 400u64;

    // Find the most recent click within the highlight window
    events
        .iter()
        .filter(|e| matches!(e.event_type, EventType::Click))
        .filter(|e| e.timestamp_ms <= time_ms && time_ms - e.timestamp_ms < highlight_duration_ms)
        .last()
        .map(|click| {
            let elapsed = time_ms - click.timestamp_ms;
            ClickHighlight {
                progress: elapsed as f64 / highlight_duration_ms as f64,
                x: click.x,
                y: click.y,
            }
        })
}
