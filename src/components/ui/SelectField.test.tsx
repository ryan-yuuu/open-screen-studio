import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SelectField } from "./SelectField";

const options = [
  { value: "Mp4", label: "MP4" },
  { value: "Gif", label: "GIF" },
];

describe("SelectField", () => {
  it("renders label text", () => {
    render(
      <SelectField label="Format" value="Mp4" options={options} onChange={vi.fn()} />
    );
    expect(screen.getByText("Format")).toBeInTheDocument();
  });

  it("renders trigger with current value text", () => {
    render(
      <SelectField label="Format" value="Mp4" options={options} onChange={vi.fn()} />
    );
    expect(screen.getByText("MP4")).toBeInTheDocument();
  });
});
