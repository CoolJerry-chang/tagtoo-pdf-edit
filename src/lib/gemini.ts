const GEMINI_FLASH_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_IMAGE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent";

const API_KEY_STORAGE_KEY = "pdfedit_gemini_api_key";

/**
 * Get the Gemini API key from localStorage
 */
export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

/**
 * Save the Gemini API key to localStorage
 */
export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

/**
 * Remove the Gemini API key from localStorage
 */
export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export interface ExtractedTextBlock {
  id: string;
  text: string;
  location: string; // human-readable description of where the text is
}

export interface TextEdit {
  originalText: string;
  newText: string;
}

/**
 * Use Gemini to extract all text blocks from a slide image
 */
export async function extractTextFromImage(
  imageDataUrl: string,
  pageIndex: number
): Promise<ExtractedTextBlock[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("請先設定 Gemini API Key");
  }

  const base64Data = imageDataUrl.split(",")[1];
  const mimeType = imageDataUrl.split(";")[0].split(":")[1];

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

  const response = await fetch(`${GEMINI_FLASH_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${error}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

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

/**
 * Use Gemini to edit text in a slide image.
 * Sends the image + edit instructions, receives the modified image back.
 */
export async function editSlideText(
  imageDataUrl: string,
  edits: TextEdit[]
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("請先設定 Gemini API Key");
  }

  const editInstructions = edits
    .map(
      (e, i) =>
        `${i + 1}. 找到「${e.originalText}」，替換為「${e.newText}」`
    )
    .join("\n");

  const prompt = `你是一個精確的圖片文字編輯器。請在這張投影片圖片中進行以下文字替換：

${editInstructions}

要求：
- 只替換指定的文字，不要改動其他任何內容
- 保持原本的字體大小、顏色、粗細、位置
- 保持背景和其他視覺元素完全不變
- 如果找不到指定的文字，保持原圖不動
- 直接回傳修改後的圖片`;

  const base64Data = imageDataUrl.split(",")[1];
  const mimeType = imageDataUrl.split(";")[0].split(":")[1];

  const response = await fetch(`${GEMINI_IMAGE_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${error}`);
  }

  const result = await response.json();
  const parts = result.candidates?.[0]?.content?.parts;

  if (!parts) {
    throw new Error("Gemini did not return any content");
  }

  for (const part of parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  // If no image returned, show what was returned
  const textParts = parts
    .filter((p: { text?: string }) => p.text)
    .map((p: { text: string }) => p.text)
    .join("\n");

  throw new Error(
    `Gemini 沒有回傳圖片。回應: ${textParts || "（空）"}`
  );
}
