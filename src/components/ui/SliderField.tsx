import * as Slider from "@radix-ui/react-slider";

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-muted">{label}</label>
        <span className="text-xs text-text-muted tabular-nums">
          {typeof value === "number" ? value.toFixed(step < 1 ? 1 : 0) : value}
          {unit}
        </span>
      </div>
      <Slider.Root
        className="relative flex items-center h-5 select-none touch-none"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      >
        <Slider.Track className="relative grow h-1 rounded-full bg-border">
          <Slider.Range className="absolute h-full rounded-full bg-primary" />
        </Slider.Track>
        <Slider.Thumb className="block w-4 h-4 rounded-full bg-white shadow-md border border-border hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors" />
      </Slider.Root>
    </div>
  );
}
