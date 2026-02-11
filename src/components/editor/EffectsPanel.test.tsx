import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EffectsPanel } from "./EffectsPanel";
import { useEditorStore } from "../../stores/editorStore";

const initialEditorState = useEditorStore.getInitialState();

beforeEach(() => {
  useEditorStore.setState(initialEditorState, true);
});

describe("EffectsPanel", () => {
  it("renders all 4 tab triggers", () => {
    render(<EffectsPanel />);
    expect(screen.getByText("Zoom")).toBeInTheDocument();
    expect(screen.getByText("Cursor")).toBeInTheDocument();
    expect(screen.getByText("Style")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("zoom tab is visible by default with auto-zoom checkbox", () => {
    render(<EffectsPanel />);
    expect(screen.getByText("Auto-zoom on clicks")).toBeInTheDocument();
  });

  it("disabling zoom hides the zoom sliders", async () => {
    const user = userEvent.setup();
    render(<EffectsPanel />);

    // Zoom Level slider should be visible when zoom is enabled
    expect(screen.getByText("Zoom Level")).toBeInTheDocument();

    // Uncheck the auto-zoom checkbox
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    // Zoom Level slider should be hidden
    expect(screen.queryByText("Zoom Level")).not.toBeInTheDocument();
  });

  it("clicking Style tab shows gradient presets", async () => {
    const user = userEvent.setup();
    render(<EffectsPanel />);

    await user.click(screen.getByText("Style"));
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.getByText("Padding")).toBeInTheDocument();
  });
});
