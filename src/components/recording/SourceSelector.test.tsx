import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SourceSelector } from "./SourceSelector";
import { makeDisplay } from "../../test/tauri-mock";

describe("SourceSelector", () => {
  it("renders one button per display", () => {
    const displays = [
      makeDisplay({ id: 1, name: "Display 1" }),
      makeDisplay({ id: 2, name: "Display 2" }),
    ];
    render(
      <SourceSelector displays={displays} selected={null} onSelect={vi.fn()} />
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });

  it("shows display name and dimensions", () => {
    const display = makeDisplay({ name: "Main Display", width: 1920, height: 1080 });
    render(
      <SourceSelector displays={[display]} selected={null} onSelect={vi.fn()} />
    );
    expect(screen.getByText("Main Display")).toBeInTheDocument();
    expect(screen.getByText("1920 x 1080")).toBeInTheDocument();
  });

  it("highlights selected display", () => {
    const display = makeDisplay({ id: 1, name: "Main" });
    render(
      <SourceSelector displays={[display]} selected={display} onSelect={vi.fn()} />
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("border-primary");
  });

  it("calls onSelect with correct DisplayInfo on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const display = makeDisplay({ id: 1, name: "Main" });
    render(
      <SourceSelector displays={[display]} selected={null} onSelect={onSelect} />
    );
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith(display);
  });

  it("handles empty displays array", () => {
    render(
      <SourceSelector displays={[]} selected={null} onSelect={vi.fn()} />
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
