import { useEffect, useState } from "react";
import {
  Video,
  FolderOpen,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useRecordingStore } from "./stores/recordingStore";
import { useRecording } from "./hooks/useRecording";
import { useProject } from "./hooks/useProject";
import { SourceSelector } from "./components/recording/SourceSelector";
import { RecordingControls } from "./components/recording/RecordingControls";
import { EditorView } from "./components/editor/EditorView";
import * as api from "./lib/tauri";
import type { Project } from "./lib/tauri";

function App() {
  const { view } = useRecordingStore();

  if (view === "editor") {
    return <EditorView />;
  }

  return <HomeView />;
}

function HomeView() {
  const {
    displays,
    selectedDisplay,
    setSelectedDisplay,
    isRecording,
    durationMs,
    startRecording,
    stopRecording,
  } = useRecording();

  const { loadProject } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [hasFfmpeg, setHasFfmpeg] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load projects and check FFmpeg on mount
  useEffect(() => {
    api.listProjects().then(setProjects).catch(console.error);
    api.checkFfmpeg().then(setHasFfmpeg).catch(() => setHasFfmpeg(false));
  }, []);

  // Refresh projects when returning from editor
  useEffect(() => {
    api.listProjects().then(setProjects).catch(console.error);
  }, [isRecording]);

  const handleStart = async () => {
    setError(null);
    try {
      await startRecording();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleStop = async () => {
    setError(null);
    try {
      await stopRecording();
      // Refresh projects list
      const updated = await api.listProjects();
      setProjects(updated);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await api.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0" data-tauri-drag-region>
        <div className="flex items-center gap-3">
          <Video size={20} className="text-primary" />
          <h1 className="text-base font-semibold">Open Screen Place</h1>
          <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-surface border border-border">
            v0.1.0
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 overflow-y-auto">
        {/* FFmpeg warning */}
        {hasFfmpeg === false && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm max-w-md">
            <AlertTriangle size={18} />
            <div>
              <p className="font-medium">FFmpeg not found</p>
              <p className="text-xs mt-1 opacity-80">
                Export requires FFmpeg. Install it with:{" "}
                <code className="bg-black/20 px-1 rounded">
                  brew install ffmpeg
                </code>
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-danger bg-danger/10 rounded-lg px-4 py-3 max-w-md">
            {error}
          </div>
        )}

        {/* Display selector */}
        {!isRecording && (
          <SourceSelector
            displays={displays}
            selected={selectedDisplay}
            onSelect={setSelectedDisplay}
          />
        )}

        {/* Recording controls */}
        <RecordingControls
          isRecording={isRecording}
          durationMs={durationMs}
          onStart={handleStart}
          onStop={handleStop}
          disabled={!selectedDisplay}
        />

        {/* Recent projects */}
        {!isRecording && projects.length > 0 && (
          <div className="w-full max-w-lg">
            <h2 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
              <FolderOpen size={14} />
              Recent Recordings
            </h2>
            <div className="flex flex-col gap-2">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface border border-border hover:border-border-bright transition-colors group"
                >
                  <button
                    onClick={() => loadProject(project.id)}
                    className="flex-1 text-left cursor-pointer"
                  >
                    <p className="text-sm font-medium truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {project.width}x{project.height} &middot;{" "}
                      {Math.round(project.duration_ms / 1000)}s &middot;{" "}
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all p-1 cursor-pointer"
                    title="Delete recording"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
