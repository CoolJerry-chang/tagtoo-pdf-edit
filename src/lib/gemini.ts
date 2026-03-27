const GEMINI_FLASH_MODEL = "gemini-2.0-flash";
const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image-preview";

const API_KEY_STORAGE_KEY = "pdfedit_gemini_api_key";

// --- API Key management (for static/GitHub Pages mode) ---

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

/**
 * Compress a data URL image to JPEG to reduce payload size for API calls.
 * Original images stay as PNG for display/export quality.
 */
function compressImageForApi(imageDataUrl: string, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to compress image"));
    img.src = imageDataUrl;
  });
}

/**
 * Check if we're running on Vercel (has server-side API route)
 */
function hasServerProxy(): boolean {
  // The API route only exists when deployed on Vercel (not static export)
  // We detect this by checking if NEXT_PUBLIC_USE_PROXY is set at build time
  return process.env.NEXT_PUBLIC_USE_PROXY === "true";
}

/**
 * Call Gemini API — routes through server proxy on Vercel, direct on GitHub Pages
 */
async function callGemini(
  model: string,
  requestBody: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (hasServerProxy()) {
    // Server proxy mode (Vercel) — key is on the server
    const payload = JSON.stringify({ model, body: requestBody });
    // Vercel Serverless Function body limit is ~4.5MB
    const payloadSizeMB = new Blob([payload]).size / (1024 * 1024);
    if (payloadSizeMB > 4) {
      throw new Error(
        `圖片太大（${payloadSizeMB.toFixed(1)}MB），超過伺服器限制。請嘗試較小的 PDF 或降低解析度。`
      );
    }
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    // Handle non-JSON responses (e.g. "Request Entity Too Large")
    const resText = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(resText);
    } catch {
      throw new Error(
        `伺服器回應異常（${res.status}）：${resText.slice(0, 100)}`
      );
    }
    if (!res.ok) {
      throw new Error(
        `Gemini API error: ${res.status} — ${JSON.stringify(data)}`
      );
    }
    return data;
  } else {
    // Direct mode (GitHub Pages) — key from localStorage
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("請先設定 Gemini API Key");
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `Gemini API error: ${res.status} — ${JSON.stringify(data)}`
      );
    }
    return data;
  }
}

// --- Types ---

export interface ExtractedTextBlock {
  id: string;
  text: string;
  location: string;
}

export interface TextEdit {
  originalText: string;
  newText: string;
  location: string;
}

// --- Text extraction ---

export async function extractTextFromImage(
  imageDataUrl: string,
  pageIndex: number
): Promise<ExtractedTextBlock[]> {
  // Compress to JPEG for API call to stay under 4.5MB limit
  const compressed = await compressImageForApi(imageDataUrl);
  const base64Data = compressed.split(",")[1];
  const mimeType = compressed.split(";")[0].split(":")[1];

  const prompt = `請分析這張投影片圖片，列出所有可見的文字內容。

請用以下 JSON 格式回傳（只回傳 JSON，不要加其他文字）：

[
  {
    "id": "1",
    "text": "文字內容",
    "location": "位置描述（例如：標題、左上角、底部註記等）"
  }
]

要求：
- 列出所有可見的文字，包括標題、副標題、內文、標籤、註記
- 按照從上到下、從左到右的閱讀順序排列
- 每個獨立的文字區塊（標題、段落、標籤）各自一項
- 如果有表格，每個儲存格的文字分開列出
- 保持原始的換行（用 \\n 表示）
- 不要遺漏任何文字，包括小字、浮水印、品牌標誌文字`;

  const result = await callGemini(GEMINI_FLASH_MODEL, {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const text = (
    result as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    }
  ).candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini did not return text content");
  }

  try {
    const blocks: { id: string; text: string; location: string }[] =
      JSON.parse(text);
    return blocks.map((b, i) => ({
      id: `page${pageIndex}-block${i}`,
      text: b.text,
      location: b.location,
    }));
  } catch {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("無法解析 Gemini 的回應");
  }
}

// --- Image editing ---

export async function editSlideText(
  imageDataUrl: string,
  edits: TextEdit[]
): Promise<string> {
  // Split edits into two strategies based on text length change
  const preciseEdits: { index: number; edit: TextEdit }[] = [];
  const rewriteEdits: { index: number; edit: TextEdit }[] = [];

  edits.forEach((e, i) => {
    if (e.originalText.length === e.newText.length) {
      preciseEdits.push({ index: i + 1, edit: e });
    } else {
      rewriteEdits.push({ index: i + 1, edit: e });
    }
  });

  const instructionParts: string[] = [];

  if (preciseEdits.length > 0) {
    instructionParts.push(
      "【精準替換】以下文字長度不變，請原位替換：",
      ...preciseEdits.map(
        ({ index, edit }) =>
          `${index}. 找到「${edit.originalText}」，替換為「${edit.newText}」`
      )
    );
  }

  if (rewriteEdits.length > 0) {
    instructionParts.push(
      "【整段重寫】以下文字的長度有變動。請根據位置描述找到該文字區域，將整塊文字完全清除，然後重新渲染為指定的新內容。不要嘗試逐字對比或局部修改，直接用新內容整段取代：",
      ...rewriteEdits.map(
        ({ index, edit }) =>
          `${index}. 位置：「${edit.location}」\n   目前內容：「${edit.originalText}」\n   請整段替換為：「${edit.newText}」`
      )
    );
  }

  const editInstructions = instructionParts.join("\n");

  const prompt = `你是一個精確的圖片文字編輯器。請在這張投影片圖片中進行以下文字修改：

${editInstructions}

要求：
- 只修改指定的文字區域，不要改動其他任何內容
- 保持原本的字體大小、顏色、粗細風格
- 保持背景和其他視覺元素完全不變
- 【整段重寫】的項目：先將該區域的舊文字完全擦除，然後以「請整段替換為」後面的新內容重新渲染。新內容就是最終結果，不要增加或遺漏任何字。自動調整間距與換行讓文字自然排列
- 【精準替換】的項目：保持原本位置不動，只替換文字內容
- 如果找不到指定的文字，保持原圖不動
- 直接回傳修改後的圖片`;

  // Compress to JPEG for API call to stay under 4.5MB limit
  const compressed = await compressImageForApi(imageDataUrl);
  const base64Data = compressed.split(",")[1];
  const mimeType = compressed.split(";")[0].split(":")[1];

  const result = await callGemini(GEMINI_IMAGE_MODEL, {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      temperature: 0.1,
    },
  });

  const parts = (
    result as {
      candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string }; text?: string }[] } }[];
    }
  ).candidates?.[0]?.content?.parts;

  if (!parts) {
    throw new Error("Gemini did not return any content");
  }

  for (const part of parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  const textParts = parts
    .filter((p) => p.text)
    .map((p) => p.text)
    .join("\n");

  throw new Error(
    `Gemini 沒有回傳圖片。回應: ${textParts || "（空）"}`
  );
}
