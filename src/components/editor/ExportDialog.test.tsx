import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportDialog } from "./ExportDialog";
import { useRecordingStore } from "../../stores/recordingStore";
import { useEditorStore } from "../../stores/editorStore";
import { makeProject } from "../../test/tauri-mock";

// Mock the tauri API module
vi.mock("../../lib/tauri", () => ({
  exportProject: vi.fn().mockResolvedValue("/tmp/export.mp4"),
  onExportProgress: vi.fn().mockResolvedValue(vi.fn()),
  onExportComplete: vi.fn().mockResolvedValue(vi.fn()),
}));

const initialRecordingState = useRecordingStore.getInitialState();
const initialEditorState = useEditorStore.getInitialState();

beforeEach(() => {
  useRecordingStore.setState(initialRecordingState, true);
  useEditorStore.setState(initialEditorState, true);
});

describe("ExportDialog", () => {
  it("renders Export button trigger", () => {
    render(<ExportDialog />);
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("opening dialog shows format/resolution/quality summary", async () => {
    const user = userEvent.setup();
    useRecordingStore.setState({ currentProject: makeProject() });

    render(<ExportDialog />);
    await user.click(screen.getByText("Export"));

    expect(screen.getByText("Export Video")).toBeInTheDocument();
    expect(screen.getByText("MP4 (H.264)")).toBeInTheDocument();
    expect(screen.getByText("1080p")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("shows progress bar when exporting", async () => {
    const user = userEvent.setup();
    useRecordingStore.setState({ currentProject: makeProject() });
    useEditorStore.setState({ isExporting: true, exportProgress: 0.45 });

    render(<ExportDialog />);
    await user.click(screen.getByRole("button", { name: /export/i }));

    expect(screen.getByText(/Exporting\.\.\. 45%/)).toBeInTheDocument();
  });

  it("shows error message on failure", async () => {
    const user = userEvent.setup();
    const { exportProject } = await import("../../lib/tauri");
    vi.mocked(exportProject).mockRejectedValueOnce(new Error("FFmpeg not found"));

    useRecordingStore.setState({ currentProject: makeProject() });
    render(<ExportDialog />);

    // Open dialog
    await user.click(screen.getByText("Export"));

    // Click the inner Export button to trigger export
    const exportButtons = screen.getAllByText("Export");
    const innerExportButton = exportButtons[exportButtons.length - 1];
    await user.click(innerExportButton);

    // Wait for the error to appear
    expect(await screen.findByText(/FFmpeg not found/)).toBeInTheDocument();
  });
});
