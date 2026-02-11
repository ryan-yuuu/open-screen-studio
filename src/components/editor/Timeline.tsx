import { useRef, useCallback } from "react";
import { useEditorStore } from "../../stores/editorStore";

interface TimelineProps {
  durationMs: number;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function Timeline({ durationMs }: TimelineProps) {
  const { events, currentTimeMs, setCurrentTimeMs } = useEditorStore();
  const trackRef = useRef<HTMLDivElement>(null);

  const clickEvents =
    events?.mouse_events.filter((e) => e.event_type === "Click") ?? [];

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current || durationMs === 0) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      setCurrentTimeMs(Math.round(ratio * durationMs));
    },
    [durationMs, setCurrentTimeMs]
  );

  const handleTrackDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return;
      handleTrackClick(e);
    },
    [handleTrackClick]
  );

  const progress = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-surface border-t border-border">
      {/* Time display */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span className="tabular-nums">{formatTime(currentTimeMs)}</span>
        <span className="tabular-nums">{formatTime(durationMs)}</span>
      </div>

      {/* Timeline track */}
      <div
        ref={trackRef}
        className="relative h-10 bg-bg rounded-lg cursor-pointer select-none"
        onClick={handleTrackClick}
        onMouseMove={handleTrackDrag}
      >
        {/* Click event markers */}
        {clickEvents.map((event, i) => {
          const position = (event.timestamp_ms / durationMs) * 100;
          return (
            <div
              key={i}
              className="absolute top-0 h-full w-0.5 bg-primary/60"
              style={{ left: `${position}%` }}
              title={`Click at ${formatTime(event.timestamp_ms)}`}
            >
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
            </div>
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white z-10"
          style={{ left: `${progress}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md" />
        </div>
      </div>

      {/* Event count */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span>{clickEvents.length} click{clickEvents.length !== 1 ? "s" : ""} detected</span>
        <span>{events?.mouse_events.length ?? 0} total events</span>
      </div>
    </div>
  );
}
