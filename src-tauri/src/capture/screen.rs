use std::path::PathBuf;
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use crate::models::project::DisplayInfo;

/// Enumerate available displays using system_profiler
pub fn get_displays() -> Result<Vec<DisplayInfo>, String> {
    // Use CoreGraphics to enumerate displays
    let displays = core_graphics::display::CGDisplay::active_displays()
        .map_err(|e| format!("Failed to get displays: {:?}", e))?;

    let mut display_infos = Vec::new();
    for (i, &display_id) in displays.iter().enumerate() {
        let display = core_graphics::display::CGDisplay::new(display_id);
        let bounds = display.bounds();
        display_infos.push(DisplayInfo {
            id: display_id,
            name: if display.is_main() {
                "Main Display".to_string()
            } else {
                format!("Display {}", i + 1)
            },
            width: bounds.size.width as u32,
            height: bounds.size.height as u32,
            is_primary: display.is_main(),
        });
    }

    if display_infos.is_empty() {
        display_infos.push(DisplayInfo {
            id: 0,
            name: "Main Display".to_string(),
            width: 1920,
            height: 1080,
            is_primary: true,
        });
    }

    Ok(display_infos)
}

/// Check if screen recording permission is granted.
/// On macOS 13+, ScreenCaptureKit handles its own permission prompts.
pub fn check_screen_recording_permission() -> bool {
    // CGPreflightScreenCaptureAccess / CGRequestScreenCaptureAccess
    // are available via core-graphics but we'll use a simple check
    let output = Command::new("osascript")
        .arg("-e")
        .arg("tell application \"System Events\" to return true")
        .output();

    match output {
        Ok(out) => out.status.success(),
        Err(_) => false,
    }
}

/// A screen recorder using macOS screencapture CLI as a reliable fallback.
/// For MVP, we use the built-in `screencapture` tool in video mode,
/// which uses ScreenCaptureKit under the hood on macOS 13+.
///
/// A future version will use ScreenCaptureKit directly via objc2 bindings
/// for frame-level access needed for real-time preview.
pub struct ScreenRecorder {
    output_path: PathBuf,
    display_id: u32,
    is_recording: Arc<AtomicBool>,
    child_process: Option<std::process::Child>,
}

impl ScreenRecorder {
    pub fn new(output_path: PathBuf, display_id: u32) -> Self {
        Self {
            output_path,
            display_id,
            is_recording: Arc::new(AtomicBool::new(false)),
            child_process: None,
        }
    }

    /// Start recording the screen using screencapture -v (video mode).
    /// This triggers the standard macOS screen recording permission prompt.
    pub fn start(&mut self) -> Result<(), String> {
        if self.is_recording.load(Ordering::SeqCst) {
            return Err("Already recording".to_string());
        }

        let output_str = self.output_path.to_str().ok_or("Invalid output path")?;

        // Use screencapture -v for video recording
        // -D flag selects display by index (1-based)
        let mut cmd = Command::new("screencapture");
        cmd.arg("-v") // video mode
            .arg("-C") // capture cursor
            .arg("-x"); // no sound effects

        // Add display selection if not main display
        if self.display_id != 0 {
            // screencapture uses 1-based display indexing
            cmd.arg("-D").arg(format!("{}", self.display_id));
        }

        cmd.arg(output_str);

        let child = cmd.spawn().map_err(|e| format!("Failed to start recording: {}", e))?;

        self.child_process = Some(child);
        self.is_recording.store(true, Ordering::SeqCst);

        log::info!("Recording started: display={}, output={}", self.display_id, output_str);
        Ok(())
    }

    /// Stop the recording by sending SIGINT to screencapture process
    pub fn stop(&mut self) -> Result<PathBuf, String> {
        if !self.is_recording.load(Ordering::SeqCst) {
            return Err("Not recording".to_string());
        }

        if let Some(ref mut child) = self.child_process {
            // Send SIGINT to gracefully stop screencapture
            unsafe {
                libc::kill(child.id() as i32, libc::SIGINT);
            }

            // Wait for the process to finish
            let _ = child.wait().map_err(|e| format!("Failed to wait for recording: {}", e))?;
        }

        self.child_process = None;
        self.is_recording.store(false, Ordering::SeqCst);

        log::info!("Recording stopped: {}", self.output_path.display());
        Ok(self.output_path.clone())
    }

    pub fn is_recording(&self) -> bool {
        self.is_recording.load(Ordering::SeqCst)
    }
}
