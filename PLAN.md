# PDFedit — NotebookLM 投影片 PDF 文字編輯器

## 專案目標
讓團隊可以上傳 NotebookLM 產出的投影片 PDF，直接在網頁上修改文字（改錯字、改寫內容），
並匯出修改後的 PDF 和 PNG 圖片。

## 需求摘要

| 項目 | 內容 |
|------|------|
| 輸入 | NotebookLM 產出的投影片 PDF（10-20 頁） |
| 編輯模式 | 側邊欄：左邊 PDF 預覽 + 右邊文字區塊清單 |
| 修改範圍 | 改錯字到改寫整段，保持原始字體樣式（可接受微小差異） |
| 輸出格式 | 修改後 PDF + 每頁 PNG 圖片（PPTX 未來再說） |
| 部署 | 本機開發 → GitHub Pages 測試 → 未來正式部署 |
| 使用者 | 團隊內部 |

## 核心流程

```
上傳 PDF
  ↓
pdf.js 渲染每頁為圖片 + 擷取文字位置
  ↓
┌────────────────────────────────────┐
│  左側：PDF 頁面預覽（可切換頁數）    │
│  右側：該頁文字區塊清單（可編輯）    │
└────────────────────────────────────┘
  ↓ 使用者修改文字後
Gemini API 將圖片中的舊文字替換為新文字
  ↓
預覽修改結果
  ↓
匯出：修改後 PDF + 每頁 PNG
```

## 技術棧

- **Next.js** — 靜態匯出，可部署 GitHub Pages
- **pdf.js (pdfjs-dist)** — PDF 渲染 + 文字擷取
- **Gemini API** — 圖片文字修改（inpainting/editing）
- **pdf-lib** — 將修改後的圖片重組為 PDF
- **Tailwind CSS** — UI 樣式

## 技術方案：AI 修圖為主

### 為什麼選 AI 修圖？
- PDF 原生文字替換有嚴重的字體嵌入 + CJK 字體問題
- AI 修圖可以自然匹配原始字體風格和背景紋理
- NotebookLM 投影片有複雜背景（網格、漸層、色塊），AI 處理更自然

### 運作方式
1. pdf.js 擷取文字位置和內容
2. 使用者在側邊欄修改文字
3. 將頁面圖片 + 修改指令送給 Gemini API
4. Gemini 回傳修改後的圖片
5. 組合成 PDF / PNG 匯出

## 開發優先順序

1. **Phase 1 — PDF 上傳 + 預覽 + 文字擷取**
   - PDF 上傳元件
   - pdf.js 渲染每頁為 canvas
   - pdf.js 擷取文字項目（內容 + 位置 + 字型資訊）
   - 頁面切換導航

2. **Phase 2 — 側邊欄編輯介面**
   - 左右分欄 layout
   - 右側顯示文字區塊清單
   - 每個區塊可編輯
   - 標記已修改的區塊

3. **Phase 3 — Gemini API 文字替換**
   - 整合 Gemini API（使用環境變數 GEMINI_API_KEY）
   - 將頁面圖片 + 編輯指令送給 Gemini
   - 接收修改後的圖片
   - 在左側預覽修改結果

4. **Phase 4 — 匯出功能**
   - PDF 匯出：將修改後的圖片組合成 PDF（pdf-lib）
   - PNG 匯出：每頁獨立下載或打包 ZIP

5. **Phase 5（未來）**
   - PPTX 匯出
   - 部署到 GitHub Pages
   - 團隊帳號 / 權限

## 參考範例

reference 資料夾中有三個 NotebookLM PDF 範例：
- `Campaign Group介紹.pdf` — 白底綠色主題，圖文混排
- `Claude_Code_Engineering_Blueprint.pdf` — 網格背景，技術藍圖風格
- `Industrial_Agent_Blueprint.pdf` — 工業設計風格，複雜圖表

## 環境設定

- GEMINI_API_KEY：已在系統環境變數中
