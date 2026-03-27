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
  originalHeight: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const imageDataUrl of pageImages) {
    const imageBytes = dataUrlToUint8Array(imageDataUrl);
    const format = getImageFormat(imageDataUrl);
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
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download all pages as PNG files packed in a ZIP
 */
export async function downloadAllPagesAsZip(
  pageImages: string[],
  baseName: string
) {
  const zip = new JSZip();

  for (let i = 0; i < pageImages.length; i++) {
    // Ensure each image is PNG (Gemini may return JPEG)
    const pngDataUrl = await ensurePng(pageImages[i]);
    const base64 = pngDataUrl.split(",")[1];
    zip.file(`${baseName}_${i + 1}.png`, base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: "blob" });
  downloadFile(blob, `${baseName}.zip`, "application/zip");
}
