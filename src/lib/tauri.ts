import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// --- Types matching Rust models ---

export interface DisplayInfo {
  id: number;
  name: string;
  width: number;
  height: number;
  is_primary: boolean;
}

export interface RecordingState {
  is_recording: boolean;
  is_paused: boolean;
  duration_ms: number;
  project_id: string | null;
}

export interface MouseEvent {
  timestamp_ms: number;
  x: number;
  y: number;
  event_type: "Click" | "Move" | "Scroll";
  button: "Left" | "Right" | "Middle" | "Other";
}

export interface RecordedEvents {
  mouse_events: MouseEvent[];
  recording_start_ms: number;
  display_width: number;
  display_height: number;
}

export type EasingType = "Linear" | "EaseIn" | "EaseOut" | "EaseInOut";

export interface ZoomConfig {
  enabled: boolean;
  zoom_level: number;
  zoom_in_duration_ms: number;
  hold_duration_ms: number;
  zoom_out_duration_ms: number;
  easing: EasingType;
}

export interface CursorConfig {
  smoothing: number;
  auto_hide_after_ms: number;
  highlight_clicks: boolean;
  highlight_color: string;
  highlight_radius: number;
}

export type Background =
  | { Solid: { color: string } }
  | { Gradient: { colors: string[]; angle: number } }
  | { Image: { path: string } };

export interface Shadow {
  offset_x: number;
  offset_y: number;
  blur: number;
  color: string;
  opacity: number;
}

export type AspectRatio = "Auto" | "Ratio16x9" | "Ratio9x16" | "Ratio1x1";

export interface FrameStyle {
  background: Background;
  padding: number;
  corner_radius: number;
  shadow: Shadow;
  aspect_ratio: AspectRatio;
}

export type ExportFormat = "Mp4" | "Gif";

export type ExportResolution =
  | "R720p"
  | "R1080p"
  | "R4k"
  | { Custom: { width: number; height: number } };

export interface ExportConfig {
  format: ExportFormat;
  resolution: ExportResolution;
  quality: number;
  output_path: string;
}

export interface Project {
  id: string;
  name: string;
  created_at: number;
  video_path: string;
  events_path: string;
  duration_ms: number;
  width: number;
  height: number;
  fps: number;
  zoom_config: ZoomConfig;
  cursor_config: CursorConfig;
  frame_style: FrameStyle;
  export_config: ExportConfig;
}

// --- System Commands ---

export async function getDisplays(): Promise<DisplayInfo[]> {
  return invoke("get_displays");
}

export async function checkPermissions(): Promise<boolean> {
  return invoke("check_permissions");
}

export async function getAppVersion(): Promise<string> {
  return invoke("get_app_version");
}

export async function checkFfmpeg(): Promise<boolean> {
  return invoke("check_ffmpeg");
}

// --- Recording Commands ---

export async function startRecording(display: DisplayInfo): Promise<string> {
  return invoke("start_recording", { display });
}

export async function stopRecording(): Promise<Project> {
  return invoke("stop_recording");
}

export async function getRecordingState(): Promise<RecordingState> {
  return invoke("get_recording_state");
}

export async function getRecordingDuration(): Promise<number> {
  return invoke("get_recording_duration");
}

// --- Editing Commands ---

export async function loadProject(projectId: string): Promise<Project> {
  return invoke("load_project", { projectId });
}

export async function loadEvents(projectId: string): Promise<RecordedEvents> {
  return invoke("load_events", { projectId });
}

export async function saveProject(project: Project): Promise<void> {
  return invoke("save_project", { project });
}

export async function updateZoomConfig(
  projectId: string,
  zoomConfig: ZoomConfig
): Promise<void> {
  return invoke("update_zoom_config", { projectId, zoomConfig });
}

export async function updateFrameStyle(
  projectId: string,
  frameStyle: FrameStyle
): Promise<void> {
  return invoke("update_frame_style", { projectId, frameStyle });
}

export async function listProjects(): Promise<Project[]> {
  return invoke("list_projects");
}

export async function deleteProject(projectId: string): Promise<void> {
  return invoke("delete_project", { projectId });
}

// --- Export Commands ---

export async function exportProject(
  projectId: string,
  config: ExportConfig
): Promise<string> {
  return invoke("export_project", { projectId, config });
}

export async function getVideoDuration(videoPath: string): Promise<number> {
  return invoke("get_video_duration", { videoPath });
}

// --- Event Listeners ---

export function onExportProgress(callback: (progress: number) => void) {
  return listen<number>("export-progress", (event) => {
    callback(event.payload);
  });
}

export function onExportComplete(callback: (path: string) => void) {
  return listen<string>("export-complete", (event) => {
    callback(event.payload);
  });
}
