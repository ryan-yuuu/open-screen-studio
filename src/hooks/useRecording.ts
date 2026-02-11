import { useCallback, useEffect, useRef } from "react";
import { useRecordingStore } from "../stores/recordingStore";
import * as api from "../lib/tauri";

export function useRecording() {
  const store = useRecordingStore();
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  // Load displays on mount
  useEffect(() => {
    api.getDisplays().then((displays) => {
      store.setDisplays(displays);
    }).catch((err) => {
      console.error("Failed to get displays:", err);
    });
  }, []);

  // Duration timer
  useEffect(() => {
    if (store.isRecording) {
      timerRef.current = setInterval(async () => {
        try {
          const duration = await api.getRecordingDuration();
          store.setDurationMs(duration);
        } catch {
          // ignore polling errors
        }
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [store.isRecording]);

  const startRecording = useCallback(async () => {
    if (!store.selectedDisplay) {
      throw new Error("No display selected");
    }
    try {
      const projectId = await api.startRecording(store.selectedDisplay);
      store.setProjectId(projectId);
      store.setRecordingActive(true);
      store.setDurationMs(0);
    } catch (err) {
      console.error("Failed to start recording:", err);
      throw err;
    }
  }, [store.selectedDisplay]);

  const stopRecording = useCallback(async () => {
    try {
      const project = await api.stopRecording();
      store.setRecordingActive(false);
      store.setCurrentProject(project);
      store.setView("editor");
      return project;
    } catch (err) {
      console.error("Failed to stop recording:", err);
      store.setRecordingActive(false);
      throw err;
    }
  }, []);

  return {
    displays: store.displays,
    selectedDisplay: store.selectedDisplay,
    setSelectedDisplay: store.setSelectedDisplay,
    isRecording: store.isRecording,
    durationMs: store.durationMs,
    startRecording,
    stopRecording,
  };
}
