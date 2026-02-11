export const DEFAULT_ZOOM_LEVEL = 2.0;
export const MIN_ZOOM_LEVEL = 1.5;
export const MAX_ZOOM_LEVEL = 3.0;

export const DEFAULT_ZOOM_IN_MS = 300;
export const DEFAULT_HOLD_MS = 500;
export const DEFAULT_ZOOM_OUT_MS = 300;

export const DEFAULT_PADDING = 64;
export const MAX_PADDING = 200;

export const DEFAULT_CORNER_RADIUS = 12;
export const MAX_CORNER_RADIUS = 40;

export const GRADIENT_PRESETS = [
  { name: "Purple Haze", colors: ["#667eea", "#764ba2"], angle: 135 },
  { name: "Ocean", colors: ["#2193b0", "#6dd5ed"], angle: 135 },
  { name: "Sunset", colors: ["#f12711", "#f5af19"], angle: 135 },
  { name: "Forest", colors: ["#134e5e", "#71b280"], angle: 135 },
  { name: "Midnight", colors: ["#0f0c29", "#302b63", "#24243e"], angle: 135 },
  { name: "Rose", colors: ["#ff9a9e", "#fecfef"], angle: 135 },
  { name: "Carbon", colors: ["#1a1a2e", "#16213e", "#0f3460"], angle: 180 },
  { name: "Slate", colors: ["#334155", "#475569"], angle: 135 },
] as const;
