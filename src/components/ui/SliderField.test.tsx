import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SliderField } from "./SliderField";

describe("SliderField", () => {
  it("renders label text", () => {
    render(
      <SliderField label="Padding" value={64} min={0} max={200} onChange={vi.fn()} />
    );
    expect(screen.getByText("Padding")).toBeInTheDocument();
  });

  it("displays value with unit", () => {
    render(
      <SliderField
        label="Padding"
        value={64}
        min={0}
        max={200}
        unit="px"
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("64px")).toBeInTheDocument();
  });

  it("uses 1 decimal for step < 1", () => {
    render(
      <SliderField
        label="Opacity"
        value={0.3}
        min={0}
        max={1}
        step={0.1}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("0.3")).toBeInTheDocument();
  });
});
