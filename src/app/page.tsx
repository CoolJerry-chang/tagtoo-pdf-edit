"use client";

import { useState, useCallback, useEffect } from "react";
import PdfUploader from "@/components/PdfUploader";
import PdfViewer from "@/components/PdfViewer";
import TextPanel from "@/components/TextPanel";
import ExportBar from "@/components/ExportBar";
import ApiKeySetup from "@/components/ApiKeySetup";
import { loadPdf, PageData, TextBlock } from "@/lib/pdf-utils";
import { extractTextFromImage, editSlideText, TextEdit } from "@/lib/gemini";
import { getApiKey, setApiKey, clearApiKey } from "@/lib/gemini";
import {
  createPdfFromImages,
  downloadFile,
  downloadAllPagesAsZip,
} from "@/lib/export-utils";

export default function Home() {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [fileName, setFileName] = useState("");
  const [modifiedImages, setModifiedImages] = useState<Record<number, string>>(
    {}
  );

  const useProxy = process.env.NEXT_PUBLIC_USE_PROXY === "true";

  // Check for API key on mount (skip if using server proxy)
  useEffect(() => {
    setHasApiKey(useProxy || !!getApiKey());
  }, [useProxy]);

  const handleApiKeySet = useCallback((key: string) => {
    setApiKey(key);
    setHasApiKey(true);
  }, []);

  const handleClearApiKey = useCallback(() => {
    clearApiKey();
    setHasApiKey(false);
  }, []);

  const handleFileSelected = useCallback(async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    try {
      const pageData = await loadPdf(file);
      setPages(pageData);
      setCurrentPage(0);
      setModifiedImages({});
      setEditStatus("");
    } catch (err) {
      console.error("Failed to load PDF:", err);
      setEditStatus(
        `載入失敗: ${err instanceof Error ? err.message : "未知錯誤"}`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExtractText = useCallback(
    async (pageIndex: number) => {
      const page = pages[pageIndex];
      if (!page || page.isTextExtracted) return;

      setIsExtracting(true);
      setEditStatus(`正在用 AI 辨識第 ${pageIndex + 1} 頁的文字...`);

      try {
        const extracted = await extractTextFromImage(
          page.imageDataUrl,
          pageIndex
        );

        const textBlocks: TextBlock[] = extracted.map((item) => ({
          id: item.id,
          pageIndex,
          text: item.text,
          editedText: item.text,
          location: item.location,
          isEdited: false,
        }));

        setPages((prev) =>
          prev.map((p, i) =>
            i === pageIndex
              ? { ...p, textBlocks, isTextExtracted: true }
              : p
          )
        );
        setEditStatus(
          `第 ${pageIndex + 1} 頁辨識完成，共 ${textBlocks.length} 個文字區塊`
        );
      } catch (err) {
        console.error("Text extraction error:", err);
        setEditStatus(
          `辨識失敗: ${err instanceof Error ? err.message : "未知錯誤"}`
        );
      } finally {
        setIsExtracting(false);
      }
    },
    [pages]
  );

  const handleTextChange = useCallback(
    (blockId: string, newText: string) => {
      setPages((prev) =>
        prev.map((page) => ({
          ...page,
          textBlocks: page.textBlocks.map((block) =>
            block.id === blockId
              ? {
                  ...block,
                  editedText: newText,
                  isEdited: newText !== block.text,
                }
              : block
          ),
        }))
      );
    },
    []
  );

  const handleApplyEdits = useCallback(
    async (pageIndex: number) => {
      const page = pages[pageIndex];
      const editedBlocks = page.textBlocks.filter((b) => b.isEdited);

      if (editedBlocks.length === 0) return;

      setIsProcessing(true);
      setEditStatus("正在呼叫 Gemini API 修改圖片中的文字...");

      try {
        const edits: TextEdit[] = editedBlocks.map((b) => ({
          originalText: b.text,
          newText: b.editedText,
        }));

        const sourceImage =
          modifiedImages[pageIndex] || page.imageDataUrl;
        const modifiedImage = await editSlideText(sourceImage, edits);

        setModifiedImages((prev) => ({
          ...prev,
          [pageIndex]: modifiedImage,
        }));
        setEditStatus(`第 ${pageIndex + 1} 頁修改完成！`);
      } catch (err) {
        console.error("Gemini API error:", err);
        setEditStatus(
          `修改失敗: ${err instanceof Error ? err.message : "未知錯誤"}`
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [pages, modifiedImages]
  );

  const handleExportPdf = useCallback(async () => {
    if (pages.length === 0) return;
    setIsExporting(true);
    setEditStatus("正在產生 PDF...");

    try {
      const finalImages = pages.map(
        (page, i) => modifiedImages[i] || page.imageDataUrl
      );
      const pdfBytes = await createPdfFromImages(
        finalImages,
        pages[0].width,
        pages[0].height
      );
      const exportName = fileName.replace(".pdf", "") + "_edited.pdf";
      downloadFile(pdfBytes, exportName, "application/pdf");
      setEditStatus("PDF 匯出完成！");
    } catch (err) {
      console.error("Export error:", err);
      setEditStatus(
        `匯出失敗: ${err instanceof Error ? err.message : "未知錯誤"}`
      );
    } finally {
      setIsExporting(false);
    }
  }, [pages, modifiedImages, fileName]);

  const handleExportPng = useCallback(async () => {
    setIsExporting(true);
    setEditStatus("正在打包 PNG ZIP...");
    try {
      const finalImages = pages.map(
        (page, i) => modifiedImages[i] || page.imageDataUrl
      );
      const baseName = fileName.replace(".pdf", "") || "slides";
      await downloadAllPagesAsZip(finalImages, baseName);
      setEditStatus("PNG ZIP 匯出完成！");
    } catch (err) {
      console.error("PNG ZIP export error:", err);
      setEditStatus(
        `匯出失敗: ${err instanceof Error ? err.message : "未知錯誤"}`
      );
    } finally {
      setIsExporting(false);
    }
  }, [pages, modifiedImages, fileName]);

  const handleReset = useCallback(() => {
    setPages([]);
    setCurrentPage(0);
    setModifiedImages({});
    setFileName("");
    setEditStatus("");
  }, []);

  const editedPageCount = Object.keys(modifiedImages).length;

  // Loading state (checking localStorage)
  if (hasApiKey === null) {
    return <div className="flex flex-col h-screen" />;
  }

  // API Key setup screen
  if (!hasApiKey) {
    return (
      <div className="flex flex-col h-screen">
        <ApiKeySetup onKeySet={handleApiKeySet} />
      </div>
    );
  }

  // Upload screen
  if (pages.length === 0) {
    return (
      <div className="flex flex-col h-screen">
        <PdfUploader
          onFileSelected={handleFileSelected}
          isLoading={isLoading}
        />
        <div className="text-center pb-4">
          <button
            className="text-xs text-muted hover:text-foreground transition-colors"
            onClick={handleClearApiKey}
          >
            重設 API Key
          </button>
        </div>
      </div>
    );
  }

  // Editor screen
  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 min-h-0">
        {/* Left: PDF preview */}
        <div className="flex-1 min-w-0 border-r border-border">
          <PdfViewer
            pages={pages}
            currentPage={currentPage}
            modifiedImages={modifiedImages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Right: Text editing panel */}
        <div className="w-[400px] flex-shrink-0">
          <TextPanel
            pages={pages}
            currentPage={currentPage}
            onTextChange={handleTextChange}
            onExtractText={handleExtractText}
            onApplyEdits={handleApplyEdits}
            isExtracting={isExtracting}
            isProcessing={isProcessing}
            editStatus={editStatus}
          />
        </div>
      </div>

      {/* Bottom: Export bar */}
      <ExportBar
        onExportPdf={handleExportPdf}
        onExportPng={handleExportPng}
        onReset={handleReset}
        isExporting={isExporting}
        fileName={fileName}
        totalPages={pages.length}
        editedPages={editedPageCount}
      />
    </div>
  );
}
