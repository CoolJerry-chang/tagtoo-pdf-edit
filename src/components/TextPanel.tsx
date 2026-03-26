"use client";

import { useState } from "react";
import { TextBlock, PageData } from "@/lib/pdf-utils";

interface TextPanelProps {
  pages: PageData[];
  currentPage: number;
  onTextChange: (blockId: string, newText: string) => void;
  onExtractText: (pageIndex: number) => void;
  onApplyEdits: (pageIndex: number) => void;
  isExtracting: boolean;
  isProcessing: boolean;
  editStatus: string;
}

export default function TextPanel({
  pages,
  currentPage,
  onTextChange,
  onExtractText,
  onApplyEdits,
  isExtracting,
  isProcessing,
  editStatus,
}: TextPanelProps) {
  const page = pages[currentPage];
  if (!page) return null;

  const editedBlocks = page.textBlocks.filter((b) => b.isEdited);
  const hasEdits = editedBlocks.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            第 {currentPage + 1} 頁
          </h2>
          {page.isTextExtracted && (
            <span className="text-xs text-muted">
              {page.textBlocks.length} 個區塊
            </span>
          )}
        </div>

        {/* Extract text button */}
        {!page.isTextExtracted && (
          <button
            className="mt-2 w-full px-3 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded transition-colors disabled:opacity-50"
            onClick={() => onExtractText(currentPage)}
            disabled={isExtracting}
          >
            {isExtracting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI 辨識文字中...
              </span>
            ) : (
              "辨識此頁文字 (AI)"
            )}
          </button>
        )}

        {/* Apply edits button */}
        {hasEdits && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-amber-400">
              {editedBlocks.length} 處修改
            </span>
            <button
              className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors disabled:opacity-50"
              onClick={() => onApplyEdits(currentPage)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI 修圖中...
                </span>
              ) : (
                "套用修改 (AI 修圖)"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Status bar */}
      {editStatus && (
        <div className="px-4 py-2 text-xs bg-surface border-b border-border text-muted">
          {editStatus}
        </div>
      )}

      {/* Text blocks */}
      <div className="flex-1 overflow-y-auto">
        {!page.isTextExtracted ? (
          <div className="p-4 text-center text-muted text-sm">
            點擊上方按鈕，用 AI 辨識此頁文字
          </div>
        ) : page.textBlocks.length === 0 ? (
          <div className="p-4 text-center text-muted text-sm">
            此頁沒有偵測到文字
          </div>
        ) : (
          page.textBlocks.map((block) => (
            <TextBlockEditor
              key={block.id}
              block={block}
              onTextChange={onTextChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TextBlockEditor({
  block,
  onTextChange,
}: {
  block: TextBlock;
  onTextChange: (blockId: string, newText: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`
        border-b border-border px-4 py-3 transition-colors
        ${block.isEdited ? "bg-amber-400/5" : "hover:bg-surface/50"}
      `}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-1 text-muted hover:text-foreground transition-colors flex-shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          {/* Location tag */}
          <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded font-mono">
            {block.location}
          </span>

          {/* Preview text */}
          <div
            className="text-sm cursor-pointer mt-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {block.isEdited ? (
              <div>
                <span className="line-through text-muted text-xs block mb-1">
                  {block.text}
                </span>
                <span className="text-amber-400">{block.editedText}</span>
              </div>
            ) : (
              <span className="text-foreground/80">
                {block.text.length > 100
                  ? block.text.slice(0, 100) + "..."
                  : block.text}
              </span>
            )}
          </div>

          {/* Edit area */}
          {isExpanded && (
            <div className="mt-2">
              <textarea
                className="w-full bg-background border border-border rounded p-2 text-sm resize-y min-h-[60px] focus:outline-none focus:border-accent transition-colors"
                value={block.editedText}
                onChange={(e) => onTextChange(block.id, e.target.value)}
                rows={Math.max(2, Math.ceil(block.editedText.length / 40))}
              />
              {block.isEdited && (
                <button
                  className="mt-1 text-xs text-muted hover:text-foreground transition-colors"
                  onClick={() => onTextChange(block.id, block.text)}
                >
                  還原
                </button>
              )}
            </div>
          )}
        </div>
        {block.isEdited && (
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400 mt-2" />
        )}
      </div>
    </div>
  );
}
