import { Circle, Square } from "lucide-react";
import { Button } from "../ui/Button";
import { formatDuration } from "../../lib/format";

interface RecordingControlsProps {
  isRecording: boolean;
  durationMs: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function RecordingControls({
  isRecording,
  durationMs,
  onStart,
  onStop,
  disabled = false,
}: RecordingControlsProps) {
  if (isRecording) {
    return (
      <div className="flex flex-col items-center gap-6">
        {/* Recording indicator */}
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
          <span className="text-sm font-medium text-danger">Recording</span>
        </div>

        {/* Timer */}
        <div className="text-5xl font-mono font-light tabular-nums tracking-wider text-text">
          {formatDuration(durationMs)}
        </div>

        {/* Stop button */}
        <Button
          variant="danger"
          size="lg"
          onClick={onStop}
          className="rounded-full w-16 h-16 p-0"
        >
          <Square size={24} fill="currentColor" />
        </Button>

        <p className="text-xs text-text-muted">Click to stop recording</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <Button
        variant="primary"
        size="lg"
        onClick={onStart}
        disabled={disabled}
        className="rounded-full w-20 h-20 p-0 shadow-xl shadow-primary/30"
      >
        <Circle size={32} fill="currentColor" />
      </Button>

      <p className="text-sm text-text-muted">
        {disabled ? "Select a display to record" : "Click to start recording"}
      </p>
    </div>
  );
}
