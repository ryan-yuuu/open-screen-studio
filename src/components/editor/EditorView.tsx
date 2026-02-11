import { useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useRecordingStore } from "../../stores/recordingStore";
import { useEditorStore } from "../../stores/editorStore";
import { useProject } from "../../hooks/useProject";
import { Button } from "../ui/Button";
import { Preview } from "./Preview";
import { Timeline } from "./Timeline";
import { EffectsPanel } from "./EffectsPanel";
import { ExportDialog } from "./ExportDialog";
import * as api from "../../lib/tauri";

export function EditorView() {
  const { currentProject, setView } = useRecordingStore();
  const { setEvents, setZoomConfig, setFrameStyle, setExportConfig } =
    useEditorStore();
  const { saveCurrentProject } = useProject();

  // Load events when project changes
  useEffect(() => {
    if (!currentProject) return;

    api
      .loadEvents(currentProject.id)
      .then((events) => {
        setEvents(events);
      })
      .catch((err) => {
        console.error("Failed to load events:", err);
      });

    // Sync editor state from project
    setZoomConfig(currentProject.zoom_config);
    setFrameStyle(currentProject.frame_style);
    setExportConfig(currentProject.export_config);
  }, [currentProject?.id]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        No project loaded
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("home")}
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div className="w-px h-5 bg-border" />
          <h1 className="text-sm font-medium truncate max-w-[200px]">
            {currentProject.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={saveCurrentProject}>
            <Save size={14} />
            Save
          </Button>
          <ExportDialog />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Preview area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Preview />
          <Timeline durationMs={currentProject.duration_ms} />
        </div>

        {/* Effects sidebar */}
        <div className="w-72 border-l border-border shrink-0">
          <EffectsPanel />
        </div>
      </div>
    </div>
  );
}
