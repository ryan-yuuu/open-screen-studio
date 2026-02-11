import * as Tabs from "@radix-ui/react-tabs";
import { Zap, MousePointer, Image, Download } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { SliderField } from "../ui/SliderField";
import { SelectField } from "../ui/SelectField";
import { GRADIENT_PRESETS } from "../../lib/constants";
import type { EasingType, Background } from "../../lib/tauri";

export function EffectsPanel() {
  return (
    <Tabs.Root defaultValue="zoom" className="flex flex-col h-full">
      <Tabs.List className="flex border-b border-border shrink-0">
        {[
          { value: "zoom", icon: Zap, label: "Zoom" },
          { value: "cursor", icon: MousePointer, label: "Cursor" },
          { value: "background", icon: Image, label: "Style" },
          { value: "export", icon: Download, label: "Export" },
        ].map(({ value, icon: Icon, label }) => (
          <Tabs.Trigger
            key={value}
            value={value}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs text-text-muted hover:text-text border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary transition-colors cursor-pointer"
          >
            <Icon size={14} />
            {label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs.Content value="zoom">
          <ZoomTab />
        </Tabs.Content>
        <Tabs.Content value="cursor">
          <CursorTab />
        </Tabs.Content>
        <Tabs.Content value="background">
          <BackgroundTab />
        </Tabs.Content>
        <Tabs.Content value="export">
          <ExportTab />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );
}

function ZoomTab() {
  const { zoomConfig, updateZoomConfig } = useEditorStore();

  return (
    <div className="flex flex-col gap-4">
      {/* Enable toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={zoomConfig.enabled}
          onChange={(e) => updateZoomConfig({ enabled: e.target.checked })}
          className="w-4 h-4 rounded accent-primary"
        />
        <span className="text-sm">Auto-zoom on clicks</span>
      </label>

      {zoomConfig.enabled && (
        <>
          <SliderField
            label="Zoom Level"
            value={zoomConfig.zoom_level}
            min={1.5}
            max={3.0}
            step={0.1}
            unit="x"
            onChange={(v) => updateZoomConfig({ zoom_level: v })}
          />
          <SliderField
            label="Zoom In Duration"
            value={zoomConfig.zoom_in_duration_ms}
            min={100}
            max={600}
            step={50}
            unit="ms"
            onChange={(v) => updateZoomConfig({ zoom_in_duration_ms: v })}
          />
          <SliderField
            label="Hold Duration"
            value={zoomConfig.hold_duration_ms}
            min={200}
            max={1000}
            step={50}
            unit="ms"
            onChange={(v) => updateZoomConfig({ hold_duration_ms: v })}
          />
          <SliderField
            label="Zoom Out Duration"
            value={zoomConfig.zoom_out_duration_ms}
            min={100}
            max={600}
            step={50}
            unit="ms"
            onChange={(v) => updateZoomConfig({ zoom_out_duration_ms: v })}
          />
          <SelectField
            label="Easing"
            value={zoomConfig.easing}
            options={[
              { value: "EaseInOut", label: "Ease In Out" },
              { value: "EaseIn", label: "Ease In" },
              { value: "EaseOut", label: "Ease Out" },
              { value: "Linear", label: "Linear" },
            ]}
            onChange={(v) => updateZoomConfig({ easing: v as EasingType })}
          />
        </>
      )}
    </div>
  );
}

function CursorTab() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-muted">
        Cursor smoothing and click highlighting will be available in a future
        update.
      </p>
    </div>
  );
}

function BackgroundTab() {
  const { frameStyle, updateFrameStyle, setBackground } = useEditorStore();

  return (
    <div className="flex flex-col gap-4">
      {/* Background presets */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-text-muted">Background</label>
        <div className="grid grid-cols-4 gap-2">
          {GRADIENT_PRESETS.map((preset) => {
            const isSelected =
              "Gradient" in frameStyle.background &&
              frameStyle.background.Gradient.colors[0] === preset.colors[0];
            return (
              <button
                key={preset.name}
                title={preset.name}
                onClick={() =>
                  setBackground({
                    Gradient: {
                      colors: [...preset.colors],
                      angle: preset.angle,
                    },
                  } as Background)
                }
                className={`
                  h-8 rounded-md border-2 transition-all cursor-pointer
                  ${isSelected ? "border-primary scale-105" : "border-transparent hover:border-border-bright"}
                `}
                style={{
                  background: `linear-gradient(${preset.angle}deg, ${preset.colors.join(", ")})`,
                }}
              />
            );
          })}
        </div>
      </div>

      <SliderField
        label="Padding"
        value={frameStyle.padding}
        min={0}
        max={200}
        step={8}
        unit="px"
        onChange={(v) => updateFrameStyle({ padding: v })}
      />

      <SliderField
        label="Corner Radius"
        value={frameStyle.corner_radius}
        min={0}
        max={40}
        unit="px"
        onChange={(v) => updateFrameStyle({ corner_radius: v })}
      />

      <SliderField
        label="Shadow Blur"
        value={frameStyle.shadow.blur}
        min={0}
        max={64}
        unit="px"
        onChange={(v) =>
          updateFrameStyle({
            shadow: { ...frameStyle.shadow, blur: v },
          })
        }
      />

      <SliderField
        label="Shadow Opacity"
        value={frameStyle.shadow.opacity}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) =>
          updateFrameStyle({
            shadow: { ...frameStyle.shadow, opacity: v },
          })
        }
      />

      <SelectField
        label="Aspect Ratio"
        value={frameStyle.aspect_ratio}
        options={[
          { value: "Auto", label: "Auto" },
          { value: "Ratio16x9", label: "16:9" },
          { value: "Ratio9x16", label: "9:16" },
          { value: "Ratio1x1", label: "1:1" },
        ]}
        onChange={(v) =>
          updateFrameStyle({
            aspect_ratio: v as "Auto" | "Ratio16x9" | "Ratio9x16" | "Ratio1x1",
          })
        }
      />
    </div>
  );
}

function ExportTab() {
  const { exportConfig, updateExportConfig } = useEditorStore();

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label="Format"
        value={exportConfig.format}
        options={[
          { value: "Mp4", label: "MP4 (H.264)" },
          { value: "Gif", label: "GIF" },
        ]}
        onChange={(v) => updateExportConfig({ format: v as "Mp4" | "Gif" })}
      />

      <SelectField
        label="Resolution"
        value={
          typeof exportConfig.resolution === "string"
            ? exportConfig.resolution
            : "Custom"
        }
        options={[
          { value: "R720p", label: "720p (1280x720)" },
          { value: "R1080p", label: "1080p (1920x1080)" },
          { value: "R4k", label: "4K (3840x2160)" },
        ]}
        onChange={(v) =>
          updateExportConfig({
            resolution: v as "R720p" | "R1080p" | "R4k",
          })
        }
      />

      <SliderField
        label="Quality"
        value={exportConfig.quality}
        min={0.3}
        max={1.0}
        step={0.05}
        onChange={(v) => updateExportConfig({ quality: v })}
      />
    </div>
  );
}
