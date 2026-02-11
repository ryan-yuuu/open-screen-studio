import { create } from "zustand";
import type {
  RecordedEvents,
  ZoomConfig,
  FrameStyle,
  ExportConfig,
  Background,
} from "../lib/tauri";

interface EditorStore {
  // Events data
  events: RecordedEvents | null;
  setEvents: (events: RecordedEvents | null) => void;

  // Playback
  currentTimeMs: number;
  isPlaying: boolean;
  setCurrentTimeMs: (ms: number) => void;
  setIsPlaying: (playing: boolean) => void;

  // Zoom config
  zoomConfig: ZoomConfig;
  setZoomConfig: (config: ZoomConfig) => void;
  updateZoomConfig: (partial: Partial<ZoomConfig>) => void;

  // Frame style
  frameStyle: FrameStyle;
  setFrameStyle: (style: FrameStyle) => void;
  updateFrameStyle: (partial: Partial<FrameStyle>) => void;
  setBackground: (bg: Background) => void;

  // Export
  exportConfig: ExportConfig;
  setExportConfig: (config: ExportConfig) => void;
  updateExportConfig: (partial: Partial<ExportConfig>) => void;
  isExporting: boolean;
  exportProgress: number;
  setIsExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
}

const defaultZoomConfig: ZoomConfig = {
  enabled: true,
  zoom_level: 2.0,
  zoom_in_duration_ms: 300,
  hold_duration_ms: 500,
  zoom_out_duration_ms: 300,
  easing: "EaseInOut",
};

const defaultFrameStyle: FrameStyle = {
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
};

const defaultExportConfig: ExportConfig = {
  format: "Mp4",
  resolution: "R1080p",
  quality: 0.8,
  output_path: "",
};

export const useEditorStore = create<EditorStore>((set) => ({
  events: null,
  setEvents: (events) => set({ events }),

  currentTimeMs: 0,
  isPlaying: false,
  setCurrentTimeMs: (ms) => set({ currentTimeMs: ms }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  zoomConfig: defaultZoomConfig,
  setZoomConfig: (config) => set({ zoomConfig: config }),
  updateZoomConfig: (partial) =>
    set((state) => ({ zoomConfig: { ...state.zoomConfig, ...partial } })),

  frameStyle: defaultFrameStyle,
  setFrameStyle: (style) => set({ frameStyle: style }),
  updateFrameStyle: (partial) =>
    set((state) => ({ frameStyle: { ...state.frameStyle, ...partial } })),
  setBackground: (bg) =>
    set((state) => ({
      frameStyle: { ...state.frameStyle, background: bg },
    })),

  exportConfig: defaultExportConfig,
  setExportConfig: (config) => set({ exportConfig: config }),
  updateExportConfig: (partial) =>
    set((state) => ({ exportConfig: { ...state.exportConfig, ...partial } })),
  isExporting: false,
  exportProgress: 0,
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
}));
