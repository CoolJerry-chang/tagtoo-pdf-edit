"use client";

import { useState } from "react";

interface ApiKeySetupProps {
  onKeySet: (key: string) => void;
}

export default function ApiKeySetup({ onKeySet }: ApiKeySetupProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = key.trim();
    if (!trimmed) {
      setError("請輸入 API Key");
      return;
    }

    setTesting(true);
    setError("");

    // Quick validation: try a simple API call
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmed}`
      );
      if (!res.ok) {
        setError("API Key 無效，請確認後再試");
        setTesting(false);
        return;
      }
      onKeySet(trimmed);
    } catch {
      setError("無法連線到 Gemini API，請檢查網路");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center">PDFedit</h1>
        <p className="text-muted mb-8 text-center">
          首次使用需要設定 Gemini API Key
        </p>

        <div className="bg-surface border border-border rounded-xl p-6">
          <label className="block text-sm font-medium mb-2">
            Gemini API Key
          </label>
          <input
            type="password"
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
            placeholder="AIza..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {error && (
            <p className="text-red-400 text-xs mt-2">{error}</p>
          )}

          <button
            className="w-full mt-4 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50 text-sm"
            onClick={handleSubmit}
            disabled={testing}
          >
            {testing ? "驗證中..." : "儲存並開始使用"}
          </button>

          <p className="text-xs text-muted mt-4">
            API Key 只會儲存在你的瀏覽器中（localStorage），不會上傳到任何伺服器。
            <br />
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              前往 Google AI Studio 取得 API Key →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
