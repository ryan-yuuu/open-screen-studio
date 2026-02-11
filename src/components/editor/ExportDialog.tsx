import * as Dialog from "@radix-ui/react-dialog";
import { Download, X, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";
import { useExport } from "../../hooks/useExport";
import { useRecordingStore } from "../../stores/recordingStore";
import { useEditorStore } from "../../stores/editorStore";

export function ExportDialog() {
  const [open, setOpen] = useState(false);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isExporting, exportProgress, startExport } = useExport();
  const { currentProject } = useRecordingStore();
  const { exportConfig, updateExportConfig } = useEditorStore();

  const handleExport = async () => {
    setError(null);
    setOutputPath(null);

    // Set output path if not set
    if (!exportConfig.output_path && currentProject) {
      const ext = exportConfig.format === "Gif" ? "gif" : "mp4";
      const defaultPath = currentProject.video_path.replace(
        /recording\.mp4$/,
        `export.${ext}`
      );
      updateExportConfig({ output_path: defaultPath });
    }

    try {
      const path = await startExport();
      setOutputPath(path);
    } catch (err) {
      setError(String(err));
    }
  };

  const progressPercent = Math.round(exportProgress * 100);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="primary" size="md">
          <Download size={16} />
          Export
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-xl shadow-2xl w-[420px] z-50 p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Export Video
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-text-muted hover:text-text cursor-pointer">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Status */}
          {isExporting ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 size={16} className="animate-spin text-primary" />
                Exporting... {progressPercent}%
              </div>
              <div className="h-2 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : outputPath ? (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle size={16} />
              Export complete!
            </div>
          ) : error ? (
            <div className="text-sm text-danger bg-danger/10 rounded-lg p-3">
              {error}
            </div>
          ) : null}

          {/* Export info */}
          {!isExporting && !outputPath && (
            <div className="flex flex-col gap-2 text-sm text-text-muted">
              <p>
                Format:{" "}
                <span className="text-text">
                  {exportConfig.format === "Mp4" ? "MP4 (H.264)" : "GIF"}
                </span>
              </p>
              <p>
                Resolution:{" "}
                <span className="text-text">
                  {typeof exportConfig.resolution === "string"
                    ? exportConfig.resolution.replace("R", "").replace("k", "K")
                    : `${exportConfig.resolution.Custom.width}x${exportConfig.resolution.Custom.height}`}
                </span>
              </p>
              <p>
                Quality:{" "}
                <span className="text-text">
                  {Math.round(exportConfig.quality * 100)}%
                </span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="secondary" size="sm">
                {outputPath ? "Close" : "Cancel"}
              </Button>
            </Dialog.Close>
            {!outputPath && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
