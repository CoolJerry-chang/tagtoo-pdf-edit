import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ALLOWED_MODELS = [
  "gemini-2.0-flash",
  "gemini-3.1-flash-image-preview",
];

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { model, body } = await request.json();

    // Validate model name to prevent abuse
    if (!ALLOWED_MODELS.includes(model)) {
      return NextResponse.json(
        { error: `Model not allowed: ${model}` },
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
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Gemini proxy error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
