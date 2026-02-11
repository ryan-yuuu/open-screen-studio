import { vi } from "vitest";
import type {
  DisplayInfo,
  Project,
  RecordedEvents,
  ZoomConfig,
  FrameStyle,
  ExportConfig,
} from "../lib/tauri";

// --- Fixture Factories ---

export function makeDisplay(overrides?: Partial<DisplayInfo>): DisplayInfo {
  return {
    id: 1,
    name: "Built-in Display",
    width: 2560,
    height: 1600,
    is_primary: true,
    ...overrides,
  };
}

export function makeEvents(overrides?: Partial<RecordedEvents>): RecordedEvents {
  return {
    mouse_events: [
      {
        timestamp_ms: 500,
        x: 100,
        y: 200,
        event_type: "Click",
        button: "Left",
      },
      {
        timestamp_ms: 1500,
        x: 300,
        y: 400,
        event_type: "Click",
        button: "Left",
      },
    ],
    recording_start_ms: 0,
    display_width: 2560,
    display_height: 1600,
    ...overrides,
  };
}

export function makeZoomConfig(overrides?: Partial<ZoomConfig>): ZoomConfig {
  return {
    enabled: true,
    zoom_level: 2.0,
    zoom_in_duration_ms: 300,
    hold_duration_ms: 500,
    zoom_out_duration_ms: 300,
    easing: "EaseInOut",
    ...overrides,
  };
}

export function makeFrameStyle(overrides?: Partial<FrameStyle>): FrameStyle {
  return {
    background: { Gradient: { colors: ["#667eea", "#764ba2"], angle: 135 } },
    padding: 64,
    corner_radius: 12,
    shadow: {
      offset_x: 0,
      offset_y: 8,
      blur: 32,
      color: "#000000",
      opacity: 0.3,
    },
    aspect_ratio: "Auto",
    ...overrides,
  };
}

export function makeExportConfig(overrides?: Partial<ExportConfig>): ExportConfig {
  return {
    format: "Mp4",
    resolution: "R1080p",
    quality: 0.8,
    output_path: "",
    ...overrides,
  };
}

export function makeProject(overrides?: Partial<Project>): Project {
  return {
    id: "test-project-id",
    name: "Test Recording",
    created_at: Date.now(),
    video_path: "/tmp/test.mp4",
    events_path: "/tmp/test.json",
    duration_ms: 5000,
    width: 2560,
    height: 1600,
    fps: 30,
    zoom_config: makeZoomConfig(),
    cursor_config: {
      smoothing: 0.5,
      auto_hide_after_ms: 3000,
      highlight_clicks: true,
      highlight_color: "#667eea",
      highlight_radius: 20,
    },
    frame_style: makeFrameStyle(),
    export_config: makeExportConfig(),
    ...overrides,
  };
}

// --- Reusable Tauri Mock ---

export function createTauriMock() {
  return {
    getDisplays: vi.fn().mockResolvedValue([]),
    checkPermissions: vi.fn().mockResolvedValue(true),
    getAppVersion: vi.fn().mockResolvedValue("0.1.0"),
    checkFfmpeg: vi.fn().mockResolvedValue(true),
    startRecording: vi.fn().mockResolvedValue("test-project-id"),
    stopRecording: vi.fn().mockResolvedValue(makeProject()),
    getRecordingState: vi.fn().mockResolvedValue({
      is_recording: false,
      is_paused: false,
      duration_ms: 0,
      project_id: null,
    }),
    getRecordingDuration: vi.fn().mockResolvedValue(0),
    loadProject: vi.fn().mockResolvedValue(makeProject()),
    loadEvents: vi.fn().mockResolvedValue(makeEvents()),
    saveProject: vi.fn().mockResolvedValue(undefined),
    updateZoomConfig: vi.fn().mockResolvedValue(undefined),
    updateFrameStyle: vi.fn().mockResolvedValue(undefined),
    listProjects: vi.fn().mockResolvedValue([]),
    deleteProject: vi.fn().mockResolvedValue(undefined),
    exportProject: vi.fn().mockResolvedValue("/tmp/export.mp4"),
    getVideoDuration: vi.fn().mockResolvedValue(5000),
    onExportProgress: vi.fn().mockResolvedValue(vi.fn()),
    onExportComplete: vi.fn().mockResolvedValue(vi.fn()),
  };
}
