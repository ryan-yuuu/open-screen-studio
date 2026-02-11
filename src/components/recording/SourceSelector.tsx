import { Monitor } from "lucide-react";
import type { DisplayInfo } from "../../lib/tauri";

interface SourceSelectorProps {
  displays: DisplayInfo[];
  selected: DisplayInfo | null;
  onSelect: (display: DisplayInfo) => void;
}

export function SourceSelector({
  displays,
  selected,
  onSelect,
}: SourceSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-text-muted">
        Select Display
      </label>
      <div className="flex gap-3">
        {displays.map((display) => {
          const isSelected = selected?.id === display.id;
          return (
            <button
              key={display.id}
              onClick={() => onSelect(display)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer
                ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-surface hover:border-border-bright hover:bg-surface-hover"
                }
              `}
            >
              <Monitor
                size={24}
                className={isSelected ? "text-primary" : "text-text-muted"}
              />
              <span className="text-sm font-medium">{display.name}</span>
              <span className="text-xs text-text-muted">
                {display.width} x {display.height}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
