use image::{Rgba, RgbaImage};

use crate::models::effects::{Background, FrameStyle, Shadow};

/// Render the background canvas with the styled frame
pub fn render_background(
    canvas_width: u32,
    canvas_height: u32,
    style: &FrameStyle,
) -> RgbaImage {
    let mut canvas = RgbaImage::new(canvas_width, canvas_height);

    // Draw background
    match &style.background {
        Background::Solid { color } => {
            let rgba = parse_hex_color(color);
            for pixel in canvas.pixels_mut() {
                *pixel = rgba;
            }
        }
        Background::Gradient { colors, angle } => {
            draw_gradient(&mut canvas, colors, *angle);
        }
        Background::Image { path: _ } => {
            // TODO: load and tile/stretch background image
            let rgba = parse_hex_color("#1a1a2e");
            for pixel in canvas.pixels_mut() {
                *pixel = rgba;
            }
        }
    }

    canvas
}

/// Composite the video frame onto the background with rounded corners and shadow
pub fn composite_frame(
    background: &RgbaImage,
    video_frame: &RgbaImage,
    style: &FrameStyle,
) -> RgbaImage {
    let mut canvas = background.clone();
    let canvas_width = canvas.width();
    let canvas_height = canvas.height();

    let frame_width = video_frame.width();
    let frame_height = video_frame.height();

    // Calculate position (centered with padding)
    let offset_x = (canvas_width.saturating_sub(frame_width)) / 2;
    let offset_y = (canvas_height.saturating_sub(frame_height)) / 2;

    // Draw shadow
    draw_shadow(&mut canvas, offset_x, offset_y, frame_width, frame_height, &style.shadow);

    // Draw video frame with rounded corners
    draw_rounded_frame(
        &mut canvas,
        video_frame,
        offset_x,
        offset_y,
        style.corner_radius,
    );

    canvas
}

/// Calculate the canvas size needed for the given frame + padding
pub fn calculate_canvas_size(frame_width: u32, frame_height: u32, style: &FrameStyle) -> (u32, u32) {
    let canvas_width = frame_width + style.padding * 2;
    let canvas_height = frame_height + style.padding * 2;
    (canvas_width, canvas_height)
}

fn draw_gradient(canvas: &mut RgbaImage, colors: &[String], angle_deg: f64) {
    if colors.is_empty() {
        return;
    }
    if colors.len() == 1 {
        let rgba = parse_hex_color(&colors[0]);
        for pixel in canvas.pixels_mut() {
            *pixel = rgba;
        }
        return;
    }

    let width = canvas.width() as f64;
    let height = canvas.height() as f64;
    let angle_rad = angle_deg.to_radians();

    // Direction vector
    let dx = angle_rad.cos();
    let dy = angle_rad.sin();

    // Project corners onto the gradient line to find min/max
    let corners = [(0.0, 0.0), (width, 0.0), (0.0, height), (width, height)];
    let projections: Vec<f64> = corners.iter().map(|(x, y)| x * dx + y * dy).collect();
    let min_proj = projections.iter().cloned().fold(f64::INFINITY, f64::min);
    let max_proj = projections.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let range = max_proj - min_proj;

    let parsed_colors: Vec<Rgba<u8>> = colors.iter().map(|c| parse_hex_color(c)).collect();

    for y in 0..canvas.height() {
        for x in 0..canvas.width() {
            let proj = (x as f64) * dx + (y as f64) * dy;
            let t = ((proj - min_proj) / range).clamp(0.0, 1.0);

            // Interpolate between gradient stops
            let segment_count = parsed_colors.len() - 1;
            let segment_t = t * segment_count as f64;
            let segment_idx = (segment_t as usize).min(segment_count - 1);
            let local_t = segment_t - segment_idx as f64;

            let c1 = &parsed_colors[segment_idx];
            let c2 = &parsed_colors[segment_idx + 1];

            let pixel = Rgba([
                lerp_u8(c1[0], c2[0], local_t),
                lerp_u8(c1[1], c2[1], local_t),
                lerp_u8(c1[2], c2[2], local_t),
                255,
            ]);

            canvas.put_pixel(x, y, pixel);
        }
    }
}

fn draw_shadow(
    canvas: &mut RgbaImage,
    offset_x: u32,
    offset_y: u32,
    width: u32,
    height: u32,
    shadow: &Shadow,
) {
    let shadow_color = parse_hex_color(&shadow.color);
    let blur = shadow.blur as i32;
    let sx = shadow.offset_x as i32;
    let sy = shadow.offset_y as i32;

    // Simple box shadow approximation
    let shadow_alpha = (shadow.opacity * 255.0) as u8;

    for dy in -blur..=(height as i32 + blur) {
        for dx in -blur..=(width as i32 + blur) {
            let px = (offset_x as i32 + dx + sx) as u32;
            let py = (offset_y as i32 + dy + sy) as u32;

            if px >= canvas.width() || py >= canvas.height() {
                continue;
            }

            // Distance from the rectangle edge
            let dist_x = if dx < 0 {
                (-dx) as f64
            } else if dx >= width as i32 {
                (dx - width as i32 + 1) as f64
            } else {
                0.0
            };
            let dist_y = if dy < 0 {
                (-dy) as f64
            } else if dy >= height as i32 {
                (dy - height as i32 + 1) as f64
            } else {
                0.0
            };
            let dist = (dist_x * dist_x + dist_y * dist_y).sqrt();

            if dist > blur as f64 {
                continue;
            }

            let alpha = shadow_alpha as f64 * (1.0 - dist / blur as f64);
            let alpha = alpha.clamp(0.0, 255.0) as u8;

            // Alpha blend shadow onto canvas
            let existing = canvas.get_pixel(px, py);
            let blended = alpha_blend(
                existing,
                &Rgba([shadow_color[0], shadow_color[1], shadow_color[2], alpha]),
            );
            canvas.put_pixel(px, py, blended);
        }
    }
}

fn draw_rounded_frame(
    canvas: &mut RgbaImage,
    frame: &RgbaImage,
    offset_x: u32,
    offset_y: u32,
    radius: u32,
) {
    let fw = frame.width();
    let fh = frame.height();

    for y in 0..fh {
        for x in 0..fw {
            // Check if pixel is within rounded corners
            if !is_in_rounded_rect(x, y, fw, fh, radius) {
                continue;
            }

            let px = offset_x + x;
            let py = offset_y + y;

            if px < canvas.width() && py < canvas.height() {
                let pixel = frame.get_pixel(x, y);
                canvas.put_pixel(px, py, *pixel);
            }
        }
    }
}

fn is_in_rounded_rect(x: u32, y: u32, width: u32, height: u32, radius: u32) -> bool {
    if radius == 0 {
        return true;
    }

    let r = radius as f64;

    // Check each corner
    let corners = [
        (radius, radius),                                    // top-left
        (width - radius, radius),                            // top-right
        (radius, height - radius),                           // bottom-left
        (width - radius, height - radius),                   // bottom-right
    ];

    for &(cx, cy) in &corners {
        let in_corner_region = (x < radius && y < radius && x <= cx && y <= cy)
            || (x >= width - radius && y < radius && x >= cx && y <= cy)
            || (x < radius && y >= height - radius && x <= cx && y >= cy)
            || (x >= width - radius && y >= height - radius && x >= cx && y >= cy);

        if in_corner_region {
            let dx = x as f64 - cx as f64;
            let dy = y as f64 - cy as f64;
            if dx * dx + dy * dy > r * r {
                return false;
            }
        }
    }

    true
}

fn parse_hex_color(hex: &str) -> Rgba<u8> {
    let hex = hex.trim_start_matches('#');
    let (r, g, b, a) = match hex.len() {
        6 => (
            u8::from_str_radix(&hex[0..2], 16).unwrap_or(0),
            u8::from_str_radix(&hex[2..4], 16).unwrap_or(0),
            u8::from_str_radix(&hex[4..6], 16).unwrap_or(0),
            255u8,
        ),
        8 => (
            u8::from_str_radix(&hex[0..2], 16).unwrap_or(0),
            u8::from_str_radix(&hex[2..4], 16).unwrap_or(0),
            u8::from_str_radix(&hex[4..6], 16).unwrap_or(0),
            u8::from_str_radix(&hex[6..8], 16).unwrap_or(255),
        ),
        _ => (0, 0, 0, 255),
    };
    Rgba([r, g, b, a])
}

fn lerp_u8(a: u8, b: u8, t: f64) -> u8 {
    (a as f64 + (b as f64 - a as f64) * t).clamp(0.0, 255.0) as u8
}

fn alpha_blend(bg: &Rgba<u8>, fg: &Rgba<u8>) -> Rgba<u8> {
    let fg_a = fg[3] as f64 / 255.0;
    let bg_a = bg[3] as f64 / 255.0;
    let out_a = fg_a + bg_a * (1.0 - fg_a);

    if out_a < 0.001 {
        return Rgba([0, 0, 0, 0]);
    }

    let r = (fg[0] as f64 * fg_a + bg[0] as f64 * bg_a * (1.0 - fg_a)) / out_a;
    let g = (fg[1] as f64 * fg_a + bg[1] as f64 * bg_a * (1.0 - fg_a)) / out_a;
    let b = (fg[2] as f64 * fg_a + bg[2] as f64 * bg_a * (1.0 - fg_a)) / out_a;

    Rgba([
        r.clamp(0.0, 255.0) as u8,
        g.clamp(0.0, 255.0) as u8,
        b.clamp(0.0, 255.0) as u8,
        (out_a * 255.0).clamp(0.0, 255.0) as u8,
    ])
}
