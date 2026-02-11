import { useRef, useEffect, useMemo } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { useRecordingStore } from "../../stores/recordingStore";
import { Play, Pause } from "lucide-react";

export function Preview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentProject } = useRecordingStore();
  const { frameStyle, currentTimeMs, isPlaying, setIsPlaying, events } =
    useEditorStore();

  const bg = frameStyle.background;

  // Render a preview visualization of the styled frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Draw background
    if ("Gradient" in bg) {
      const { colors, angle } = bg.Gradient;
      const rad = (angle * Math.PI) / 180;
      const x1 = w / 2 - (Math.cos(rad) * w) / 2;
      const y1 = h / 2 - (Math.sin(rad) * h) / 2;
      const x2 = w / 2 + (Math.cos(rad) * w) / 2;
      const y2 = h / 2 + (Math.sin(rad) * h) / 2;
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      colors.forEach((color, i) => {
        gradient.addColorStop(i / Math.max(1, colors.length - 1), color);
      });
      ctx.fillStyle = gradient;
    } else if ("Solid" in bg) {
      ctx.fillStyle = bg.Solid.color;
    } else {
      ctx.fillStyle = "#1a1a2e";
    }
    ctx.fillRect(0, 0, w, h);

    // Draw frame placeholder
    const padding = frameStyle.padding * (w / 1920); // Scale padding to preview
    const frameX = padding;
    const frameY = padding;
    const frameW = w - padding * 2;
    const frameH = h - padding * 2;
    const radius = frameStyle.corner_radius * (w / 1920);

    // Shadow
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${frameStyle.shadow.opacity})`;
    ctx.shadowBlur = frameStyle.shadow.blur * (w / 1920);
    ctx.shadowOffsetX = frameStyle.shadow.offset_x * (w / 1920);
    ctx.shadowOffsetY = frameStyle.shadow.offset_y * (w / 1920);

    // Rounded rectangle
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, radius);
    ctx.fillStyle = "#1e1e2e";
    ctx.fill();
    ctx.restore();

    // Screen content placeholder
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, radius);
    ctx.clip();

    // Draw a mock desktop
    ctx.fillStyle = "#2d2d44";
    ctx.fillRect(frameX, frameY, frameW, frameH);

    // Menu bar
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(frameX, frameY, frameW, 24 * (w / 1920));

    // Draw some placeholder "windows"
    const winPad = 40 * (w / 1920);
    ctx.fillStyle = "#363650";
    ctx.beginPath();
    ctx.roundRect(
      frameX + winPad,
      frameY + 50 * (w / 1920),
      frameW * 0.6,
      frameH * 0.7,
      8 * (w / 1920)
    );
    ctx.fill();

    // Click indicators from events
    if (events) {
      const clicks = events.mouse_events.filter(
        (e) => e.event_type === "Click"
      );
      clicks.forEach((click) => {
        // Scale click position to preview canvas
        const relX = click.x / events.display_width;
        const relY = click.y / events.display_height;
        const px = frameX + relX * frameW;
        const py = frameY + relY * frameH;

        ctx.beginPath();
        ctx.arc(px, py, 4 * (w / 1920), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(102, 126, 234, 0.6)";
        ctx.fill();
      });
    }
  }, [frameStyle, bg, currentTimeMs, events]);

  const containerStyle = useMemo(() => {
    return {
      aspectRatio:
        frameStyle.aspect_ratio === "Ratio16x9"
          ? "16/9"
          : frameStyle.aspect_ratio === "Ratio9x16"
            ? "9/16"
            : frameStyle.aspect_ratio === "Ratio1x1"
              ? "1/1"
              : "16/9",
    };
  }, [frameStyle.aspect_ratio]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 min-h-0">
      {/* Preview canvas */}
      <div
        className="relative w-full max-h-full rounded-lg overflow-hidden shadow-2xl"
        style={containerStyle}
      >
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="w-full h-full object-contain"
        />

        {/* Play/Pause overlay */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs hover:bg-black/80 transition-colors cursor-pointer"
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {/* Project info */}
      {currentProject && (
        <div className="text-xs text-text-muted">
          {currentProject.width}x{currentProject.height} &middot;{" "}
          {Math.round(currentProject.duration_ms / 1000)}s
        </div>
      )}
    </div>
  );
}
