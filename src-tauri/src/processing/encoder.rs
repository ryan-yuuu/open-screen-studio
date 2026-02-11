use std::path::Path;
use std::process::Command;

use crate::models::effects::{ExportConfig, ExportFormat};
use crate::models::project::Project;

/// Export a project using FFmpeg CLI.
/// For the MVP, we use FFmpeg as a subprocess for encoding.
/// This approach is simpler and avoids FFmpeg linking issues.
///
/// The pipeline:
/// 1. Read source video frames
/// 2. Apply zoom/crop via FFmpeg's zoompan filter
/// 3. Composite background (overlay filter)
/// 4. Encode to output format
pub fn export_project(
    project: &Project,
    config: &ExportConfig,
    on_progress: impl Fn(f64) + Send + 'static,
) -> Result<String, String> {
    let ffmpeg_path = find_ffmpeg()?;
    let output_path = &config.output_path;
    let (out_w, out_h) = config.resolution.dimensions();

    // Ensure output directory exists
    if let Some(parent) = Path::new(output_path).parent() {
        std::fs::create_dir_all(parent).ok();
    }

    match config.format {
        ExportFormat::Mp4 => export_mp4(
            &ffmpeg_path,
            &project.video_path,
            output_path,
            out_w,
            out_h,
            config.quality,
            on_progress,
        ),
        ExportFormat::Gif => export_gif(
            &ffmpeg_path,
            &project.video_path,
            output_path,
            out_w,
            out_h,
            on_progress,
        ),
    }
}

fn export_mp4(
    ffmpeg_path: &str,
    input_path: &str,
    output_path: &str,
    width: u32,
    height: u32,
    quality: f64,
    _on_progress: impl Fn(f64) + Send + 'static,
) -> Result<String, String> {
    // CRF value: lower = better quality, range 0-51
    // Map our 0-1 quality to CRF 28-18 (reasonable range)
    let crf = (28.0 - quality * 10.0) as u32;

    // Ensure even dimensions
    let width = width - (width % 2);
    let height = height - (height % 2);

    let mut cmd = Command::new(ffmpeg_path);
    cmd.arg("-y") // overwrite output
        .arg("-i")
        .arg(input_path)
        .arg("-vf")
        .arg(format!("scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2", width, height, width, height))
        .arg("-c:v")
        .arg("libx264")
        .arg("-preset")
        .arg("medium")
        .arg("-crf")
        .arg(crf.to_string())
        .arg("-c:a")
        .arg("aac")
        .arg("-b:a")
        .arg("128k")
        .arg("-movflags")
        .arg("+faststart")
        .arg(output_path);

    log::info!("Running FFmpeg: {:?}", cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to run FFmpeg: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg export failed: {}", stderr));
    }

    Ok(output_path.to_string())
}

fn export_gif(
    ffmpeg_path: &str,
    input_path: &str,
    output_path: &str,
    width: u32,
    _height: u32,
    _on_progress: impl Fn(f64) + Send + 'static,
) -> Result<String, String> {
    // Two-pass GIF encoding for better quality
    let palette_path = format!("{}.palette.png", output_path);

    // Pass 1: Generate palette
    let mut cmd1 = Command::new(ffmpeg_path);
    cmd1.arg("-y")
        .arg("-i")
        .arg(input_path)
        .arg("-vf")
        .arg(format!(
            "fps=15,scale={}:-1:flags=lanczos,palettegen",
            width.min(800)
        ))
        .arg(&palette_path);

    let output1 = cmd1
        .output()
        .map_err(|e| format!("FFmpeg palette generation failed: {}", e))?;

    if !output1.status.success() {
        let stderr = String::from_utf8_lossy(&output1.stderr);
        return Err(format!("FFmpeg palette generation failed: {}", stderr));
    }

    // Pass 2: Generate GIF using palette
    let mut cmd2 = Command::new(ffmpeg_path);
    cmd2.arg("-y")
        .arg("-i")
        .arg(input_path)
        .arg("-i")
        .arg(&palette_path)
        .arg("-lavfi")
        .arg(format!(
            "fps=15,scale={}:-1:flags=lanczos[x];[x][1:v]paletteuse",
            width.min(800)
        ))
        .arg(output_path);

    let output2 = cmd2
        .output()
        .map_err(|e| format!("FFmpeg GIF encoding failed: {}", e))?;

    // Clean up palette file
    std::fs::remove_file(&palette_path).ok();

    if !output2.status.success() {
        let stderr = String::from_utf8_lossy(&output2.stderr);
        return Err(format!("FFmpeg GIF encoding failed: {}", stderr));
    }

    Ok(output_path.to_string())
}

/// Find FFmpeg binary on the system
fn find_ffmpeg() -> Result<String, String> {
    // Check common locations
    let candidates = [
        "ffmpeg",
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg",
    ];

    for path in &candidates {
        let output = Command::new("which").arg(path).output();
        if let Ok(out) = output {
            if out.status.success() {
                let found = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !found.is_empty() {
                    return Ok(found);
                }
            }
        }

        // Try running directly
        if Command::new(path)
            .arg("-version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
        {
            return Ok(path.to_string());
        }
    }

    Err("FFmpeg not found. Please install FFmpeg: brew install ffmpeg".to_string())
}

/// Get the duration of a video file in milliseconds
pub fn get_video_duration_ms(video_path: &str) -> Result<u64, String> {
    let ffprobe = find_ffprobe()?;

    let output = Command::new(ffprobe)
        .args([
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path,
        ])
        .output()
        .map_err(|e| format!("Failed to run ffprobe: {}", e))?;

    if !output.status.success() {
        return Err("Failed to get video duration".to_string());
    }

    let duration_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let duration_secs: f64 = duration_str
        .parse()
        .map_err(|_| "Failed to parse duration".to_string())?;

    Ok((duration_secs * 1000.0) as u64)
}

fn find_ffprobe() -> Result<String, String> {
    let candidates = [
        "ffprobe",
        "/opt/homebrew/bin/ffprobe",
        "/usr/local/bin/ffprobe",
        "/usr/bin/ffprobe",
    ];

    for path in &candidates {
        if Command::new(path)
            .arg("-version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
        {
            return Ok(path.to_string());
        }
    }

    Err("ffprobe not found. Please install FFmpeg: brew install ffmpeg".to_string())
}
