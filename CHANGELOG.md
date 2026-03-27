# PDFedit 修改紀錄

## 2026-03-27 (下午)

### 修圖 prompt 策略 v2
- 整段重寫改為「位置描述 + 完整最終文字」，不再讓 Gemini 逐字對比原文
- 加入 `location` 資訊輔助定位（標題、內文、左上角等）
- prompt 明確指示「先擦除舊文字，再渲染新內容」
- 解決刪除少量字（如「的的」→「」）時 Gemini 忽略修改的問題

### 修圖 prompt 智慧分策略
- 等長替換（字元數相同）→ 精準替換，原位換字
- 不等長（增刪字）→ 整段重寫，自動調整間距換行

### 修圖 timeout 修復
- API Route `maxDuration` 從 60s 提高到 300s，解決 504 FUNCTION_INVOCATION_TIMEOUT

### 匯出 UI 改善
- 匯出按鈕加入 spinner 動畫 + 閃爍提示文字
- 匯出中所有按鈕 disabled + not-allowed 游標，防止重複點擊

## 2026-03-27

### 匯出功能修復
- PDF 匯出：修正圖片格式偵測（PNG/JPEG 自動判斷），解決匯出失敗問題
- PNG 匯出：改為 ZIP 打包一次下載，Gemini 回傳的 JPEG 自動轉回無損 PNG

### 辨識失敗修復
- 原因：PDF 頁面轉 PNG 後 base64 超過 Vercel 4.5MB body 限制，伺服器回傳純文字導致 JSON 解析失敗
- 解法：內部儲存維持 PNG 全品質，送 API 時即時壓縮為 JPEG 0.8；加入 payload 大小預檢與非 JSON 回應處理

### 資安強化
- API Key 改用 server-side API Route 代理（Vercel），不再暴露於前端
- GitHub Pages 備用方案改用 localStorage 存 key
- API Route 加入 Origin 檢查 + 錯誤訊息消毒

### 部署架構
- Vercel 正式站：`pdfedit-app.vercel.app`（API Key 藏伺服器端）
- GitHub Pages 備用站（靜態匯出 + localStorage key）

### 核心功能上線
- PDF 上傳 → Gemini AI 辨識投影片文字 → 編輯 → AI 修圖 → 匯出 PDF/PNG
- 修圖模型：`gemini-3.1-flash-image-preview`（唯一支援中文不亂碼）

## 2026-03-26

### 專案建立
- Next.js + Tailwind CSS 初始化
