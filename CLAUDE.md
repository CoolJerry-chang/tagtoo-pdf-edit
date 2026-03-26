# PDFedit

## 專案概述
NotebookLM 投影片 PDF 文字編輯器。使用者上傳 PDF，在側邊欄編輯文字，透過 Gemini API 修改圖片中的文字，匯出 PDF/PNG。

## 技術棧
- Next.js (靜態匯出)
- pdfjs-dist (PDF 渲染 + 文字擷取)
- Gemini API (圖片文字修改)
- pdf-lib (PDF 組合匯出)
- Tailwind CSS

## 開發規範
- 使用繁體中文 UI
- 全部在瀏覽器端處理（純前端，無後端 API route — Gemini 呼叫除外）
- Gemini API key 從環境變數 GEMINI_API_KEY 讀取
- 參考範例 PDF 在 /reference 資料夾

## 架構
詳見 /PLAN.md

@AGENTS.md
