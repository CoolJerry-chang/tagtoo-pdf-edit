"use client";

interface ExportBarProps {
  onExportPdf: () => void;
  onExportPng: () => void;
  onReset: () => void;
  isExporting: boolean;
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
  isExporting,
  fileName,
  totalPages,
  editedPages,
}: ExportBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-surface border-t border-border">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium truncate max-w-[200px]">
          {fileName}
        </span>
        <span className="text-xs text-muted">
          {totalPages} 頁 | {editedPages} 頁已修改
        </span>
        {isExporting && (
          <span className="text-xs text-accent animate-pulse">
            正在匯出，請稍候...
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
          className="px-3 py-1.5 text-xs rounded border border-border hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          onClick={onExportPng}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Spinner />
              匯出中...
            </>
          ) : (
            "匯出 PNG (ZIP)"
          )}
        </button>
        <button
          className="px-3 py-1.5 text-xs rounded bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          onClick={onExportPdf}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Spinner />
              匯出中...
            </>
          ) : (
            "匯出 PDF"
          )}
        </button>
      </div>
    </div>
  );
}
