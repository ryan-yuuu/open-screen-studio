import { useCallback } from "react";
import { useRecordingStore } from "../stores/recordingStore";
import { useEditorStore } from "../stores/editorStore";
import * as api from "../lib/tauri";

export function useProject() {
  const { currentProject, setCurrentProject, setView } = useRecordingStore();
  const editorStore = useEditorStore();

  const loadProject = useCallback(
    async (projectId: string) => {
      const project = await api.loadProject(projectId);
      setCurrentProject(project);

      // Load events
      const events = await api.loadEvents(projectId);
      editorStore.setEvents(events);

      // Sync editor state from project
      editorStore.setZoomConfig(project.zoom_config);
      editorStore.setFrameStyle(project.frame_style);
      editorStore.setExportConfig(project.export_config);

      setView("editor");
      return project;
    },
    [setCurrentProject, setView, editorStore]
  );

  const saveCurrentProject = useCallback(async () => {
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      zoom_config: editorStore.zoomConfig,
      frame_style: editorStore.frameStyle,
      export_config: editorStore.exportConfig,
    };

    await api.saveProject(updated);
    setCurrentProject(updated);
  }, [currentProject, editorStore.zoomConfig, editorStore.frameStyle, editorStore.exportConfig]);

  return {
    currentProject,
    loadProject,
    saveCurrentProject,
  };
}
