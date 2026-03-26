export interface TextBlock {
  id: string;
  pageIndex: number;
  text: string;
  editedText: string;
  location: string;
  isEdited: boolean;
}

export interface PageData {
  pageIndex: number;
  width: number;
  height: number;
  textBlocks: TextBlock[];
  imageDataUrl: string;
  isTextExtracted: boolean;
}

/**
 * Load a PDF file and render each page as an image.
 * Text extraction is done separately via Gemini.
 */
export async function loadPdf(file: File): Promise<PageData[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: PageData[] = [];

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx, viewport } as any).promise;
    const imageDataUrl = canvas.toDataURL("image/png");

    pages.push({
      pageIndex: i,
      width: viewport.width,
      height: viewport.height,
      textBlocks: [],
      imageDataUrl,
      isTextExtracted: false,
    });
  }

  return pages;
}

/**
 * Convert a data URL to a Uint8Array for pdf-lib
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
}
