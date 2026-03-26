import { PDFDocument } from "pdf-lib";
import { dataUrlToUint8Array } from "./pdf-utils";

/**
 * Create a PDF from an array of page images (data URLs)
 */
export async function createPdfFromImages(
  pageImages: string[],
  originalWidth: number,
  originalHeight: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const imageDataUrl of pageImages) {
    const imageBytes = dataUrlToUint8Array(imageDataUrl);
    const image = await pdfDoc.embedPng(imageBytes);

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
 * Download a file from a Uint8Array
 */
export function downloadFile(
  data: Uint8Array | Blob,
  filename: string,
  mimeType: string
) {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download a single page as PNG
 */
export function downloadPageAsPng(imageDataUrl: string, pageIndex: number) {
  const a = document.createElement("a");
  a.href = imageDataUrl;
  a.download = `slide-${pageIndex + 1}.png`;
  a.click();
}

/**
 * Download all pages as individual PNGs in a zip
 * (Simple approach: downloads each one separately)
 */
export function downloadAllPagesAsPng(pageImages: string[]) {
  pageImages.forEach((img, i) => {
    setTimeout(() => downloadPageAsPng(img, i), i * 200);
  });
}
