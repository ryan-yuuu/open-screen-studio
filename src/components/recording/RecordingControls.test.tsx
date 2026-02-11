import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecordingControls } from "./RecordingControls";

const defaultProps = {
  isRecording: false,
  durationMs: 0,
  onStart: vi.fn(),
  onStop: vi.fn(),
};

describe("RecordingControls", () => {
  it("shows record button when not recording", () => {
    render(<RecordingControls {...defaultProps} />);
    expect(screen.getByText("Click to start recording")).toBeInTheDocument();
  });

  it('shows "Select a display to record" when disabled', () => {
    render(<RecordingControls {...defaultProps} disabled />);
    expect(screen.getByText("Select a display to record")).toBeInTheDocument();
  });

  it("calls onStart on record click", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<RecordingControls {...defaultProps} onStart={onStart} />);
    await user.click(screen.getByRole("button"));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("shows stop button and timer when recording", () => {
    render(
      <RecordingControls {...defaultProps} isRecording durationMs={0} />
    );
    expect(screen.getByText("Recording")).toBeInTheDocument();
    expect(screen.getByText("Click to stop recording")).toBeInTheDocument();
  });

  it("displays formatted duration", () => {
    render(
      <RecordingControls {...defaultProps} isRecording durationMs={61000} />
    );
    expect(screen.getByText("01:01")).toBeInTheDocument();
  });

  it("calls onStop on stop click", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    render(
      <RecordingControls {...defaultProps} isRecording onStop={onStop} />
    );
    await user.click(screen.getByRole("button"));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("record button disabled when disabled=true", () => {
    render(<RecordingControls {...defaultProps} disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
