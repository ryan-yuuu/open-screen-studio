import { useCallback, useEffect } from "react";
import { useRecordingStore } from "../stores/recordingStore";
import { useEditorStore } from "../stores/editorStore";
import * as api from "../lib/tauri";

export function useExport() {
  const { currentProject } = useRecordingStore();
  const editorStore = useEditorStore();

  // Listen for export progress events
  useEffect(() => {
    const unlisten1 = api.onExportProgress((progress) => {
      editorStore.setExportProgress(progress);
    });
    const unlisten2 = api.onExportComplete(() => {
      editorStore.setIsExporting(false);
      editorStore.setExportProgress(1.0);
    });

    return () => {
      unlisten1.then((fn) => fn());
      unlisten2.then((fn) => fn());
    };
  }, []);

  const startExport = useCallback(async () => {
    if (!currentProject) {
      throw new Error("No project loaded");
    }

    editorStore.setIsExporting(true);
    editorStore.setExportProgress(0);

    try {
      const outputPath = await api.exportProject(
        currentProject.id,
        editorStore.exportConfig
      );
      editorStore.setIsExporting(false);
      return outputPath;
    } catch (err) {
      editorStore.setIsExporting(false);
      throw err;
    }
  }, [currentProject, editorStore.exportConfig]);

  return {
    isExporting: editorStore.isExporting,
    exportProgress: editorStore.exportProgress,
    exportConfig: editorStore.exportConfig,
    updateExportConfig: editorStore.updateExportConfig,
    startExport,
  };
}
