import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useRecordingStore } from "../../stores/recordingStore";
import { useEditorStore } from "../../stores/editorStore";
import { makeProject } from "../../test/tauri-mock";

// Mock the tauri API module — factory must not reference outer imports
vi.mock("../../lib/tauri", () => ({
  loadEvents: vi.fn().mockResolvedValue({
    mouse_events: [],
    recording_start_ms: 0,
    display_width: 2560,
    display_height: 1600,
  }),
  loadProject: vi.fn().mockResolvedValue({}),
  saveProject: vi.fn().mockResolvedValue(undefined),
  exportProject: vi.fn().mockResolvedValue("/tmp/export.mp4"),
  onExportProgress: vi.fn().mockResolvedValue(vi.fn()),
  onExportComplete: vi.fn().mockResolvedValue(vi.fn()),
}));

// Mock canvas for Preview component
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  createLinearGradient: vi.fn().mockReturnValue({
    addColorStop: vi.fn(),
  }),
  roundRect: vi.fn(),
  clip: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  drawImage: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 0 }),
  set fillStyle(_v: string) {},
  set strokeStyle(_v: string) {},
  set lineWidth(_v: number) {},
  set shadowColor(_v: string) {},
  set shadowBlur(_v: number) {},
  set shadowOffsetX(_v: number) {},
  set shadowOffsetY(_v: number) {},
  set globalAlpha(_v: number) {},
  set font(_v: string) {},
  set textAlign(_v: string) {},
  set textBaseline(_v: string) {},
});

const initialRecordingState = useRecordingStore.getInitialState();
const initialEditorState = useEditorStore.getInitialState();

beforeEach(() => {
  useRecordingStore.setState(initialRecordingState, true);
  useEditorStore.setState(initialEditorState, true);
});

describe("EditorView", () => {
  it('shows "No project loaded" when currentProject is null', async () => {
    const { EditorView } = await import("./EditorView");
    render(<EditorView />);
    expect(screen.getByText("No project loaded")).toBeInTheDocument();
  });

  it("renders project name in header when loaded", async () => {
    const { EditorView } = await import("./EditorView");
    const project = makeProject({ name: "My Screen Recording" });
    useRecordingStore.setState({ currentProject: project });
    render(<EditorView />);
    expect(screen.getByText("My Screen Recording")).toBeInTheDocument();
  });

  it("renders Back, Save, Export buttons", async () => {
    const { EditorView } = await import("./EditorView");
    useRecordingStore.setState({ currentProject: makeProject() });
    render(<EditorView />);
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    // Use getAllByText since "Export" appears in both header button and EffectsPanel tab
    const exportElements = screen.getAllByText("Export");
    expect(exportElements.length).toBeGreaterThanOrEqual(1);
  });

  it("calls loadEvents on mount with project ID", async () => {
    const { EditorView } = await import("./EditorView");
    const api = await import("../../lib/tauri");
    vi.mocked(api.loadEvents).mockClear();

    const project = makeProject({ id: "proj-42" });
    useRecordingStore.setState({ currentProject: project });
    render(<EditorView />);

    expect(api.loadEvents).toHaveBeenCalledWith("proj-42");
  });
});
