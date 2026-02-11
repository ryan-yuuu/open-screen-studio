import { describe, it, expect } from "vitest";
import { GRADIENT_PRESETS } from "./constants";

describe("GRADIENT_PRESETS", () => {
  it("is non-empty", () => {
    expect(GRADIENT_PRESETS.length).toBeGreaterThan(0);
  });

  it("every preset has name, colors (>=2), and numeric angle", () => {
    for (const preset of GRADIENT_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.colors.length).toBeGreaterThanOrEqual(2);
      expect(typeof preset.angle).toBe("number");
    }
  });

  it("all color strings match hex pattern", () => {
    for (const preset of GRADIENT_PRESETS) {
      for (const color of preset.colors) {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it("preset names are unique", () => {
    const names = GRADIENT_PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
