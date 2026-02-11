use image::RgbaImage;

use crate::models::effects::{FrameStyle, ZoomConfig};
use crate::models::events::RecordedEvents;
use crate::processing::background;
use crate::processing::zoom::{self, FrameViewport, ZoomKeyframe};

/// The compositor combines all layers for a single frame:
/// Background -> Shadow -> Rounded Frame -> Video Content (with zoom) -> Cursor
pub struct Compositor {
    pub frame_style: FrameStyle,
    pub zoom_keyframes: Vec<ZoomKeyframe>,
    pub source_width: u32,
    pub source_height: u32,
    pub output_width: u32,
    pub output_height: u32,
}

impl Compositor {
    pub fn new(
        frame_style: FrameStyle,
        zoom_config: &ZoomConfig,
        events: &RecordedEvents,
        source_width: u32,
        source_height: u32,
    ) -> Self {
        let click_events = events.click_events();
        let zoom_keyframes = zoom::generate_zoom_keyframes(&click_events, zoom_config);

        let (output_width, output_height) = background::calculate_canvas_size(
            source_width,
            source_height,
            &frame_style,
        );

        Self {
            frame_style,
            zoom_keyframes,
            source_width,
            source_height,
            output_width,
            output_height,
        }
    }

    /// Get the viewport (crop region) for a frame at the given timestamp
    pub fn get_viewport(&self, time_ms: u64) -> FrameViewport {
        zoom::compute_zoom_at_time(
            time_ms,
            &self.zoom_keyframes,
            self.source_width as f64,
            self.source_height as f64,
        )
    }

    /// Compose a single frame with all effects applied
    pub fn compose_frame(
        &self,
        source_frame: &RgbaImage,
        time_ms: u64,
    ) -> RgbaImage {
        // 1. Apply zoom (crop and scale the source frame)
        let viewport = self.get_viewport(time_ms);
        let zoomed_frame = apply_zoom_crop(source_frame, &viewport, self.source_width, self.source_height);

        // 2. Render background
        let bg = background::render_background(
            self.output_width,
            self.output_height,
            &self.frame_style,
        );

        // 3. Composite frame onto background
        background::composite_frame(&bg, &zoomed_frame, &self.frame_style)
    }
}

/// Crop and scale a source frame according to the zoom viewport
fn apply_zoom_crop(
    source: &RgbaImage,
    viewport: &FrameViewport,
    target_width: u32,
    target_height: u32,
) -> RgbaImage {
    if (viewport.zoom - 1.0).abs() < 0.01 {
        // No zoom: return source as-is (or resized to target)
        if source.width() == target_width && source.height() == target_height {
            return source.clone();
        }
        return image::imageops::resize(
            source,
            target_width,
            target_height,
            image::imageops::FilterType::Lanczos3,
        );
    }

    // Crop the viewport region from the source
    let crop_x = viewport.x.max(0.0) as u32;
    let crop_y = viewport.y.max(0.0) as u32;
    let crop_w = (viewport.width as u32).min(source.width() - crop_x);
    let crop_h = (viewport.height as u32).min(source.height() - crop_y);

    let cropped = image::imageops::crop_imm(source, crop_x, crop_y, crop_w, crop_h).to_image();

    // Scale back up to the original frame size
    image::imageops::resize(
        &cropped,
        target_width,
        target_height,
        image::imageops::FilterType::Lanczos3,
    )
}
