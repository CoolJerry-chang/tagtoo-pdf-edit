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
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-xs rounded border border-border hover:bg-surface-hover transition-colors"
          onClick={onReset}
        >
          重新上傳
        </button>
        <button
          className="px-3 py-1.5 text-xs rounded border border-border hover:bg-surface-hover transition-colors disabled:opacity-50"
          onClick={onExportPng}
          disabled={isExporting}
        >
          {isExporting ? "匯出中..." : "匯出 PNG (ZIP)"}
        </button>
        <button
          className="px-3 py-1.5 text-xs rounded bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50"
          onClick={onExportPdf}
          disabled={isExporting}
        >
          {isExporting ? "匯出中..." : "匯出 PDF"}
        </button>
      </div>
    </div>
  );
}
