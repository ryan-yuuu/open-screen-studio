use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EasingType {
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut,
}

impl Default for EasingType {
    fn default() -> Self {
        Self::EaseInOut
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZoomConfig {
    pub enabled: bool,
    /// 1.5 - 3.0, default 2.0
    pub zoom_level: f64,
    /// ms, default 300
    pub zoom_in_duration_ms: u64,
    /// ms, default 500
    pub hold_duration_ms: u64,
    /// ms, default 300
    pub zoom_out_duration_ms: u64,
    pub easing: EasingType,
}

impl Default for ZoomConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            zoom_level: 2.0,
            zoom_in_duration_ms: 300,
            hold_duration_ms: 500,
            zoom_out_duration_ms: 300,
            easing: EasingType::EaseInOut,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CursorConfig {
    pub smoothing: f64,
    pub auto_hide_after_ms: u64,
    pub highlight_clicks: bool,
    pub highlight_color: String,
    pub highlight_radius: u32,
}

impl Default for CursorConfig {
    fn default() -> Self {
        Self {
            smoothing: 0.5,
            auto_hide_after_ms: 3000,
            highlight_clicks: true,
            highlight_color: "#FFD700".to_string(),
            highlight_radius: 30,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Background {
    Solid { color: String },
    Gradient { colors: Vec<String>, angle: f64 },
    Image { path: String },
}

impl Default for Background {
    fn default() -> Self {
        Self::Gradient {
            colors: vec!["#667eea".to_string(), "#764ba2".to_string()],
            angle: 135.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shadow {
    pub offset_x: f64,
    pub offset_y: f64,
    pub blur: f64,
    pub color: String,
    pub opacity: f64,
}

impl Default for Shadow {
    fn default() -> Self {
        Self {
            offset_x: 0.0,
            offset_y: 8.0,
            blur: 32.0,
            color: "#000000".to_string(),
            opacity: 0.3,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AspectRatio {
    Auto,
    Ratio16x9,
    Ratio9x16,
    Ratio1x1,
}

impl Default for AspectRatio {
    fn default() -> Self {
        Self::Auto
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameStyle {
    pub background: Background,
    pub padding: u32,
    pub corner_radius: u32,
    pub shadow: Shadow,
    pub aspect_ratio: AspectRatio,
}

impl Default for FrameStyle {
    fn default() -> Self {
        Self {
            background: Background::default(),
            padding: 64,
            corner_radius: 12,
            shadow: Shadow::default(),
            aspect_ratio: AspectRatio::Auto,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportFormat {
    Mp4,
    Gif,
}

impl Default for ExportFormat {
    fn default() -> Self {
        Self::Mp4
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportResolution {
    R720p,
    R1080p,
    R4k,
    Custom { width: u32, height: u32 },
}

impl Default for ExportResolution {
    fn default() -> Self {
        Self::R1080p
    }
}

impl ExportResolution {
    pub fn dimensions(&self) -> (u32, u32) {
        match self {
            Self::R720p => (1280, 720),
            Self::R1080p => (1920, 1080),
            Self::R4k => (3840, 2160),
            Self::Custom { width, height } => (*width, *height),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportConfig {
    pub format: ExportFormat,
    pub resolution: ExportResolution,
    /// 0.0 - 1.0
    pub quality: f64,
    pub output_path: String,
}

impl Default for ExportConfig {
    fn default() -> Self {
        Self {
            format: ExportFormat::default(),
            resolution: ExportResolution::default(),
            quality: 0.8,
            output_path: String::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_export_resolution_dimensions() {
        assert_eq!(ExportResolution::R720p.dimensions(), (1280, 720));
        assert_eq!(ExportResolution::R1080p.dimensions(), (1920, 1080));
        assert_eq!(ExportResolution::R4k.dimensions(), (3840, 2160));
        assert_eq!(
            ExportResolution::Custom { width: 800, height: 600 }.dimensions(),
            (800, 600)
        );
    }

    #[test]
    fn test_zoom_config_serde_roundtrip() {
        let config = ZoomConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: ZoomConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.enabled, config.enabled);
        assert!((deserialized.zoom_level - config.zoom_level).abs() < 1e-10);
        assert_eq!(deserialized.zoom_in_duration_ms, config.zoom_in_duration_ms);
    }

    #[test]
    fn test_frame_style_serde_roundtrip() {
        let style = FrameStyle::default();
        let json = serde_json::to_string(&style).unwrap();
        let deserialized: FrameStyle = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.padding, style.padding);
        assert_eq!(deserialized.corner_radius, style.corner_radius);
    }

    #[test]
    fn test_background_serde_roundtrip() {
        let backgrounds = vec![
            Background::Solid { color: "#FF0000".to_string() },
            Background::Gradient {
                colors: vec!["#000".to_string(), "#FFF".to_string()],
                angle: 45.0,
            },
            Background::Image { path: "/tmp/bg.png".to_string() },
        ];

        for bg in &backgrounds {
            let json = serde_json::to_string(bg).unwrap();
            let deserialized: Background = serde_json::from_str(&json).unwrap();
            let re_json = serde_json::to_string(&deserialized).unwrap();
            assert_eq!(json, re_json);
        }
    }
}
