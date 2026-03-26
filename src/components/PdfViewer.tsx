"use client";

import { PageData } from "@/lib/pdf-utils";

interface PdfViewerProps {
  pages: PageData[];
  currentPage: number;
  modifiedImages: Record<number, string>;
  onPageChange: (page: number) => void;
}

export default function PdfViewer({
  pages,
  currentPage,
  modifiedImages,
  onPageChange,
}: PdfViewerProps) {
  const page = pages[currentPage];
  if (!page) return null;

  const displayImage = modifiedImages[currentPage] || page.imageDataUrl;

  return (
    <div className="flex flex-col h-full">
      {/* Page navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
        <button
          className="px-3 py-1 rounded text-sm hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          disabled={currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ← 上一頁
        </button>
        <span className="text-sm text-muted font-mono">
          {currentPage + 1} / {pages.length}
        </span>
        <button
          className="px-3 py-1 rounded text-sm hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          disabled={currentPage === pages.length - 1}
          onClick={() => onPageChange(currentPage + 1)}
        >
          下一頁 →
        </button>
      </div>

      {/* Page thumbnails */}
      <div className="flex gap-1 px-4 py-2 overflow-x-auto border-b border-border bg-surface/50">
        {pages.map((_, i) => (
          <button
            key={i}
            className={`
              flex-shrink-0 w-8 h-8 rounded text-xs font-mono transition-all
              ${
                i === currentPage
                  ? "bg-accent text-white"
                  : "bg-surface hover:bg-surface-hover text-muted"
              }
            `}
            onClick={() => onPageChange(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Image preview */}
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
        <img
          src={displayImage}
          alt={`Page ${currentPage + 1}`}
          className="max-w-full h-auto rounded shadow-lg"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        />
      </div>

      {/* Modified indicator */}
      {modifiedImages[currentPage] && (
        <div className="px-4 py-1 text-center text-xs text-green-400 bg-green-400/10 border-t border-green-400/20">
          已修改 — 顯示 AI 編輯後的結果
        </div>
      )}
    </div>
  );
}
