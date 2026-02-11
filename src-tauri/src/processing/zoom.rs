use crate::models::effects::{EasingType, ZoomConfig};
use crate::models::events::MouseEvent;

/// Represents a zoom animation triggered by a click event
#[derive(Debug, Clone)]
pub struct ZoomKeyframe {
    /// Start time of the zoom animation (ms)
    pub start_ms: u64,
    /// End time of the zoom animation (ms)
    pub end_ms: u64,
    /// Center X of the zoom (screen coords)
    pub center_x: f64,
    /// Center Y of the zoom (screen coords)
    pub center_y: f64,
    /// Peak zoom level
    pub peak_zoom: f64,
    /// Duration of each phase
    pub zoom_in_ms: u64,
    pub hold_ms: u64,
    pub zoom_out_ms: u64,
    pub easing: EasingType,
}

/// The computed viewport for a single frame
#[derive(Debug, Clone, serde::Serialize)]
pub struct FrameViewport {
    /// Crop rectangle in source coordinates
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    /// Current zoom factor (1.0 = no zoom)
    pub zoom: f64,
    /// Center point of the zoom
    pub center_x: f64,
    pub center_y: f64,
}

/// Generates zoom keyframes from click events
pub fn generate_zoom_keyframes(
    click_events: &[&MouseEvent],
    config: &ZoomConfig,
) -> Vec<ZoomKeyframe> {
    if !config.enabled {
        return Vec::new();
    }

    let total_duration = config.zoom_in_duration_ms + config.hold_duration_ms + config.zoom_out_duration_ms;

    click_events
        .iter()
        .map(|event| {
            ZoomKeyframe {
                start_ms: event.timestamp_ms,
                end_ms: event.timestamp_ms + total_duration,
                center_x: event.x,
                center_y: event.y,
                peak_zoom: config.zoom_level,
                zoom_in_ms: config.zoom_in_duration_ms,
                hold_ms: config.hold_duration_ms,
                zoom_out_ms: config.zoom_out_duration_ms,
                easing: config.easing.clone(),
            }
        })
        .collect()
}

/// Calculate the zoom factor at a given time based on active keyframes
pub fn compute_zoom_at_time(
    time_ms: u64,
    keyframes: &[ZoomKeyframe],
    source_width: f64,
    source_height: f64,
) -> FrameViewport {
    let mut max_zoom: f64 = 1.0;
    let mut center_x = source_width / 2.0;
    let mut center_y = source_height / 2.0;

    for kf in keyframes {
        if time_ms < kf.start_ms || time_ms > kf.end_ms {
            continue;
        }

        let elapsed = time_ms - kf.start_ms;
        let zoom_factor;

        if elapsed < kf.zoom_in_ms {
            // Zooming in phase
            let t = elapsed as f64 / kf.zoom_in_ms as f64;
            let eased_t = apply_easing(t, &kf.easing);
            zoom_factor = 1.0 + (kf.peak_zoom - 1.0) * eased_t;
        } else if elapsed < kf.zoom_in_ms + kf.hold_ms {
            // Hold phase
            zoom_factor = kf.peak_zoom;
        } else {
            // Zooming out phase
            let out_elapsed = elapsed - kf.zoom_in_ms - kf.hold_ms;
            let t = out_elapsed as f64 / kf.zoom_out_ms as f64;
            let eased_t = apply_easing(t, &kf.easing);
            zoom_factor = kf.peak_zoom - (kf.peak_zoom - 1.0) * eased_t;
        }

        if zoom_factor > max_zoom {
            max_zoom = zoom_factor;
            center_x = kf.center_x;
            center_y = kf.center_y;
        }
    }

    // Calculate crop rectangle
    let crop_w = source_width / max_zoom;
    let crop_h = source_height / max_zoom;

    // Clamp center so crop doesn't go out of bounds
    let half_w = crop_w / 2.0;
    let half_h = crop_h / 2.0;
    let clamped_x = center_x.clamp(half_w, source_width - half_w);
    let clamped_y = center_y.clamp(half_h, source_height - half_h);

    FrameViewport {
        x: clamped_x - half_w,
        y: clamped_y - half_h,
        width: crop_w,
        height: crop_h,
        zoom: max_zoom,
        center_x: clamped_x,
        center_y: clamped_y,
    }
}

/// Apply easing function to a normalized time value (0.0 - 1.0)
fn apply_easing(t: f64, easing: &EasingType) -> f64 {
    let t = t.clamp(0.0, 1.0);
    match easing {
        EasingType::Linear => t,
        EasingType::EaseIn => t * t * t,
        EasingType::EaseOut => 1.0 - (1.0 - t).powi(3),
        EasingType::EaseInOut => {
            if t < 0.5 {
                4.0 * t * t * t
            } else {
                1.0 - (-2.0 * t + 2.0).powi(3) / 2.0
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_easing_boundaries() {
        for easing in &[
            EasingType::Linear,
            EasingType::EaseIn,
            EasingType::EaseOut,
            EasingType::EaseInOut,
        ] {
            let start = apply_easing(0.0, easing);
            let end = apply_easing(1.0, easing);
            assert!((start - 0.0).abs() < 1e-10, "Easing should start at 0");
            assert!((end - 1.0).abs() < 1e-10, "Easing should end at 1");
        }
    }

    #[test]
    fn test_no_zoom_returns_full_viewport() {
        let viewport = compute_zoom_at_time(500, &[], 1920.0, 1080.0);
        assert!((viewport.zoom - 1.0).abs() < 1e-10);
        assert!((viewport.width - 1920.0).abs() < 1e-10);
        assert!((viewport.height - 1080.0).abs() < 1e-10);
    }

    #[test]
    fn test_zoom_at_peak() {
        let kf = ZoomKeyframe {
            start_ms: 0,
            end_ms: 1100,
            center_x: 960.0,
            center_y: 540.0,
            peak_zoom: 2.0,
            zoom_in_ms: 300,
            hold_ms: 500,
            zoom_out_ms: 300,
            easing: EasingType::Linear,
        };

        // At the hold phase (400ms in)
        let viewport = compute_zoom_at_time(400, &[kf], 1920.0, 1080.0);
        assert!((viewport.zoom - 2.0).abs() < 1e-10);
        assert!((viewport.width - 960.0).abs() < 1e-10);
    }
}
