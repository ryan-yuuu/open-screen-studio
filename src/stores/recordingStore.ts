import { create } from "zustand";
import type { DisplayInfo, Project } from "../lib/tauri";

type AppView = "home" | "recording" | "editor";

interface RecordingStore {
  // Navigation
  view: AppView;
  setView: (view: AppView) => void;

  // Display selection
  displays: DisplayInfo[];
  selectedDisplay: DisplayInfo | null;
  setDisplays: (displays: DisplayInfo[]) => void;
  setSelectedDisplay: (display: DisplayInfo | null) => void;

  // Recording state
  isRecording: boolean;
  isPaused: boolean;
  durationMs: number;
  projectId: string | null;
  setRecordingActive: (active: boolean) => void;
  setDurationMs: (ms: number) => void;
  setProjectId: (id: string | null) => void;

  // Current project (after recording or loading)
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
}

export const useRecordingStore = create<RecordingStore>((set) => ({
  view: "home",
  setView: (view) => set({ view }),

  displays: [],
  selectedDisplay: null,
  setDisplays: (displays) =>
    set({
      displays,
      selectedDisplay: displays.find((d) => d.is_primary) ?? displays[0] ?? null,
    }),
  setSelectedDisplay: (display) => set({ selectedDisplay: display }),

  isRecording: false,
  isPaused: false,
  durationMs: 0,
  projectId: null,
  setRecordingActive: (active) => set({ isRecording: active }),
  setDurationMs: (ms) => set({ durationMs: ms }),
  setProjectId: (id) => set({ projectId: id }),

  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
}));
