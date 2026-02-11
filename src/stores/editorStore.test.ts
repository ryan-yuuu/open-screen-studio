import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./editorStore";
import { makeEvents } from "../test/tauri-mock";

// Reset store to initial state between tests
const initialState = useEditorStore.getInitialState();

beforeEach(() => {
  useEditorStore.setState(initialState, true);
});

describe("editorStore", () => {
  it("has expected initial defaults", () => {
    const state = useEditorStore.getState();
    expect(state.events).toBeNull();
    expect(state.currentTimeMs).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(state.zoomConfig.enabled).toBe(true);
    expect(state.zoomConfig.zoom_level).toBe(2.0);
    expect(state.frameStyle.padding).toBe(64);
    expect(state.exportConfig.format).toBe("Mp4");
    expect(state.isExporting).toBe(false);
    expect(state.exportProgress).toBe(0);
  });

  it("setEvents updates events", () => {
    const events = makeEvents();
    useEditorStore.getState().setEvents(events);
    expect(useEditorStore.getState().events).toBe(events);
  });

  it("setCurrentTimeMs updates current time", () => {
    useEditorStore.getState().setCurrentTimeMs(1500);
    expect(useEditorStore.getState().currentTimeMs).toBe(1500);
  });

  it("setIsPlaying updates playing state", () => {
    useEditorStore.getState().setIsPlaying(true);
    expect(useEditorStore.getState().isPlaying).toBe(true);
  });

  it("updateZoomConfig does partial merge", () => {
    useEditorStore.getState().updateZoomConfig({ zoom_level: 2.5 });
    const config = useEditorStore.getState().zoomConfig;
    expect(config.zoom_level).toBe(2.5);
    expect(config.enabled).toBe(true); // preserved
    expect(config.easing).toBe("EaseInOut"); // preserved
  });

  it("setZoomConfig replaces entire config", () => {
    const newConfig = {
      enabled: false,
      zoom_level: 1.5,
      zoom_in_duration_ms: 100,
      hold_duration_ms: 200,
      zoom_out_duration_ms: 100,
      easing: "Linear" as const,
    };
    useEditorStore.getState().setZoomConfig(newConfig);
    expect(useEditorStore.getState().zoomConfig).toEqual(newConfig);
  });

  it("updateFrameStyle does partial merge", () => {
    useEditorStore.getState().updateFrameStyle({ padding: 32 });
    const style = useEditorStore.getState().frameStyle;
    expect(style.padding).toBe(32);
    expect(style.corner_radius).toBe(12); // preserved
  });

  it("setBackground updates nested background in frameStyle", () => {
    const newBg = { Solid: { color: "#ff0000" } } as const;
    useEditorStore.getState().setBackground(newBg);
    const style = useEditorStore.getState().frameStyle;
    expect(style.background).toEqual(newBg);
    expect(style.padding).toBe(64); // preserved
  });

  it("updateExportConfig does partial merge", () => {
    useEditorStore.getState().updateExportConfig({ quality: 0.5 });
    const config = useEditorStore.getState().exportConfig;
    expect(config.quality).toBe(0.5);
    expect(config.format).toBe("Mp4"); // preserved
  });

  it("setIsExporting and setExportProgress work", () => {
    useEditorStore.getState().setIsExporting(true);
    useEditorStore.getState().setExportProgress(0.75);
    expect(useEditorStore.getState().isExporting).toBe(true);
    expect(useEditorStore.getState().exportProgress).toBe(0.75);
  });

  it("multiple sequential updates compose correctly", () => {
    const { setCurrentTimeMs, setIsPlaying, updateZoomConfig } =
      useEditorStore.getState();
    setCurrentTimeMs(2000);
    setIsPlaying(true);
    updateZoomConfig({ enabled: false });

    const state = useEditorStore.getState();
    expect(state.currentTimeMs).toBe(2000);
    expect(state.isPlaying).toBe(true);
    expect(state.zoomConfig.enabled).toBe(false);
    expect(state.zoomConfig.zoom_level).toBe(2.0); // preserved
  });
});
