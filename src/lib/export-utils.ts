import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { dataUrlToUint8Array } from "./pdf-utils";

/**
 * Detect image format from a data URL
 */
function getImageFormat(dataUrl: string): "png" | "jpeg" {
  return dataUrl.startsWith("data:image/jpeg") ? "jpeg" : "png";
}

/**
 * Ensure a data URL is in PNG format (for high-quality export).
 * If already PNG, returns as-is. If JPEG (e.g. from Gemini), converts to PNG.
 */
function ensurePng(imageDataUrl: string): Promise<string> {
  if (getImageFormat(imageDataUrl) === "png") {
    return Promise.resolve(imageDataUrl);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to convert image to PNG"));
    img.src = imageDataUrl;
  });
}

/**
 * Create a PDF from an array of page images (data URLs).
 * Handles both PNG and JPEG images automatically.
 */
export async function createPdfFromImages(
  pageImages: string[],
  originalWidth: number,
  originalHeight: number,
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < pageImages.length; i++) {
    onProgress?.(i + 1, pageImages.length);
    const imageBytes = dataUrlToUint8Array(pageImages[i]);
    const format = getImageFormat(pageImages[i]);
    const image =
      format === "jpeg"
        ? await pdfDoc.embedJpg(imageBytes)
        : await pdfDoc.embedPng(imageBytes);

    // Use original PDF dimensions (at scale 1, not 2x)
    const pageWidth = originalWidth / 2;
    const pageHeight = originalHeight / 2;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    page.drawImage(image, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
    // Yield to UI thread so progress updates render
    await new Promise((r) => setTimeout(r, 10));
  }

  return await pdfDoc.save();
}

/**
 * Download a file from a Uint8Array or Blob
 */
export function downloadFile(
  data: Uint8Array | Blob,
  filename: string,
  mimeType: string
) {
  const blob =
    data instanceof Blob
      ? data
      : new Blob([data as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Delay cleanup so the browser has time to start the download
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Download all pages as PNG files packed in a ZIP
 */
export async function downloadAllPagesAsZip(
  pageImages: string[],
  baseName: string,
  onProgress?: (current: number, total: number) => void
) {
  const zip = new JSZip();

  for (let i = 0; i < pageImages.length; i++) {
    onProgress?.(i + 1, pageImages.length);
    // Ensure each image is PNG (Gemini may return JPEG)
    const pngDataUrl = await ensurePng(pageImages[i]);
    const base64 = pngDataUrl.split(",")[1];
    zip.file(`${baseName}_${i + 1}.png`, base64, { base64: true });
    await new Promise((r) => setTimeout(r, 0));
  }

  const blob = await zip.generateAsync({ type: "blob" });
  downloadFile(blob, `${baseName}.zip`, "application/zip");
}
