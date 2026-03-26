import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ALLOWED_MODELS = [
  "gemini-2.0-flash",
  "gemini-3.1-flash-image-preview",
];

const ALLOWED_ORIGINS = [
  "https://pdfedit-app.vercel.app",
  "http://localhost:3000",
];

export async function POST(request: NextRequest) {
  // Origin check — only allow requests from our own frontend
  const origin = request.headers.get("origin") || "";
  const referer = request.headers.get("referer") || "";
  const isAllowed =
    ALLOWED_ORIGINS.some((o) => origin.startsWith(o) || referer.startsWith(o)) ||
    // Allow Vercel preview deployments
    origin.includes("vercel.app") ||
    referer.includes("vercel.app");

  if (!isAllowed) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server API key not configured" },
      { status: 500 }
    );
  }

  try {
    const text = await request.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { model, body } = parsed;

    if (!ALLOWED_MODELS.includes(model)) {
      return NextResponse.json(
        { error: "Model not allowed" },
        { status: 400 }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      // Sanitize: only forward the error message, not full Google response
      const errorMsg =
        (data as { error?: { message?: string } }).error?.message ||
        "Gemini API request failed";
      return NextResponse.json(
        { error: errorMsg },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
