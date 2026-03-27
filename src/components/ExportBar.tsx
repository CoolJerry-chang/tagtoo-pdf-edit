"use client";

interface ExportBarProps {
  onExportPdf: () => void;
  onExportPng: () => void;
  onReset: () => void;
  exportingType: "pdf" | "png" | null;
  exportProgress: string;
  fileName: string;
  totalPages: number;
  editedPages: number;
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function ExportBar({
  onExportPdf,
  onExportPng,
  onReset,
  exportingType,
  exportProgress,
  fileName,
  totalPages,
  editedPages,
}: ExportBarProps) {
  const isExporting = exportingType !== null;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-surface border-t border-border">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium truncate max-w-[200px]">
          {fileName}
        </span>
        <span className="text-xs text-muted">
          {totalPages} 頁 | {editedPages} 頁已修改
        </span>
        {isExporting && exportProgress && (
          <span className="text-xs text-accent font-medium animate-pulse">
            {exportProgress}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-xs rounded border border-border hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onReset}
          disabled={isExporting}
        >
          重新上傳
        </button>
        <button
          className={`px-3 py-1.5 text-xs rounded border transition-all flex items-center gap-1.5 disabled:cursor-not-allowed ${
            exportingType === "png"
              ? "bg-accent text-white border-accent"
              : "border-border hover:bg-surface-hover disabled:opacity-50"
          }`}
          onClick={onExportPng}
          disabled={isExporting}
        >
          {exportingType === "png" ? (
            <>
              <Spinner />
              匯出中 {exportProgress ? "" : "..."}
            </>
          ) : (
            "匯出 PNG (ZIP)"
          )}
        </button>
        <button
          className={`px-3 py-1.5 text-xs rounded transition-all flex items-center gap-1.5 disabled:cursor-not-allowed ${
            exportingType === "pdf"
              ? "bg-green-600 text-white"
              : "bg-accent hover:bg-accent-hover text-white disabled:opacity-50"
          }`}
          onClick={onExportPdf}
          disabled={isExporting}
        >
          {exportingType === "pdf" ? (
            <>
              <Spinner />
              匯出中 {exportProgress ? "" : "..."}
            </>
          ) : (
            "匯出 PDF"
          )}
        </button>
      </div>
    </div>
  );
}
