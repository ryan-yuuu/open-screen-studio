import { describe, it, expect, beforeEach } from "vitest";
import { useRecordingStore } from "./recordingStore";
import { makeDisplay, makeProject } from "../test/tauri-mock";

const initialState = useRecordingStore.getInitialState();

beforeEach(() => {
  useRecordingStore.setState(initialState, true);
});

describe("recordingStore", () => {
  it("has expected initial state", () => {
    const state = useRecordingStore.getState();
    expect(state.view).toBe("home");
    expect(state.displays).toEqual([]);
    expect(state.selectedDisplay).toBeNull();
    expect(state.isRecording).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.durationMs).toBe(0);
    expect(state.projectId).toBeNull();
    expect(state.currentProject).toBeNull();
  });

  it("setView changes view", () => {
    useRecordingStore.getState().setView("recording");
    expect(useRecordingStore.getState().view).toBe("recording");
  });

  it("setDisplays auto-selects primary display", () => {
    const primary = makeDisplay({ id: 1, is_primary: true });
    const secondary = makeDisplay({
      id: 2,
      name: "External",
      is_primary: false,
    });
    useRecordingStore.getState().setDisplays([secondary, primary]);
    expect(useRecordingStore.getState().selectedDisplay).toEqual(primary);
  });

  it("setDisplays falls back to first display when no primary", () => {
    const d1 = makeDisplay({ id: 1, is_primary: false, name: "Display 1" });
    const d2 = makeDisplay({ id: 2, is_primary: false, name: "Display 2" });
    useRecordingStore.getState().setDisplays([d1, d2]);
    expect(useRecordingStore.getState().selectedDisplay).toEqual(d1);
  });

  it("setDisplays with empty array sets selectedDisplay to null", () => {
    // First set a display
    useRecordingStore.getState().setDisplays([makeDisplay()]);
    expect(useRecordingStore.getState().selectedDisplay).not.toBeNull();

    // Then clear
    useRecordingStore.getState().setDisplays([]);
    expect(useRecordingStore.getState().selectedDisplay).toBeNull();
  });

  it("setSelectedDisplay overrides auto-selection", () => {
    const d1 = makeDisplay({ id: 1, is_primary: true });
    const d2 = makeDisplay({ id: 2, is_primary: false, name: "External" });
    useRecordingStore.getState().setDisplays([d1, d2]);
    expect(useRecordingStore.getState().selectedDisplay).toEqual(d1);

    useRecordingStore.getState().setSelectedDisplay(d2);
    expect(useRecordingStore.getState().selectedDisplay).toEqual(d2);
  });

  it("setRecordingActive updates isRecording", () => {
    useRecordingStore.getState().setRecordingActive(true);
    expect(useRecordingStore.getState().isRecording).toBe(true);
  });

  it("setDurationMs updates duration", () => {
    useRecordingStore.getState().setDurationMs(5000);
    expect(useRecordingStore.getState().durationMs).toBe(5000);
  });

  it("setProjectId updates projectId", () => {
    useRecordingStore.getState().setProjectId("abc-123");
    expect(useRecordingStore.getState().projectId).toBe("abc-123");
  });

  it("setCurrentProject updates currentProject", () => {
    const project = makeProject();
    useRecordingStore.getState().setCurrentProject(project);
    expect(useRecordingStore.getState().currentProject).toBe(project);
  });
});
