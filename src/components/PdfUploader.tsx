"use client";

import { useCallback, useRef, useState } from "react";

interface PdfUploaderProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export default function PdfUploader({
  onFileSelected,
  isLoading,
}: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type === "application/pdf") {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold mb-2">PDFedit</h1>
        <p className="text-muted mb-8">
          上傳 NotebookLM 投影片 PDF，輕鬆編輯文字內容
        </p>

        <div
          className={`
            border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all
            ${
              isDragging
                ? "border-accent bg-accent/10"
                : "border-border hover:border-muted hover:bg-surface"
            }
            ${isLoading ? "opacity-50 pointer-events-none" : ""}
          `}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-muted">正在解析 PDF...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <svg
                className="w-12 h-12 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-foreground font-medium">
                拖放 PDF 檔案到這裡，或點擊選擇
              </p>
              <p className="text-sm text-muted">支援 NotebookLM 產出的投影片 PDF</p>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    </div>
  );
}
