import { describe, it, expect } from "vitest";
import { formatTime, formatDuration } from "./format";

describe("formatTime", () => {
  it("formats 0ms as 0:00", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  it("floors sub-second values", () => {
    expect(formatTime(999)).toBe("0:00");
  });

  it("formats exactly 1 second", () => {
    expect(formatTime(1000)).toBe("0:01");
  });

  it("formats 59 seconds", () => {
    expect(formatTime(59999)).toBe("0:59");
  });

  it("formats exactly 1 minute", () => {
    expect(formatTime(60000)).toBe("1:00");
  });

  it("formats 1 minute and 1 second", () => {
    expect(formatTime(61000)).toBe("1:01");
  });
});

describe("formatDuration", () => {
  it("formats 0ms with padded minutes", () => {
    expect(formatDuration(0)).toBe("00:00");
  });

  it("formats 1 minute 1 second with padded minutes", () => {
    expect(formatDuration(61000)).toBe("01:01");
  });

  it("formats just under 1 hour", () => {
    expect(formatDuration(3599999)).toBe("59:59");
  });
});
