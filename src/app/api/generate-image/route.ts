import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { context, model } = await req.json();

    if (!context) {
      return NextResponse.json({ error: "Context required" }, { status: 400 });
    }

    const imageModel = model || process.env.OPENROUTER_IMAGE_MODEL || "openai/gpt-5-image-mini";

    const prompt = `Create a vivid, historically accurate illustration for the following historical context. The image should look like a high-quality textbook illustration or historical painting. No text or labels in the image.

Context: ${context}

Generate a single image that captures the essence of this historical moment.`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://superhistorian.vercel.app",
        "X-Title": "Super Historian",
      },
      body: JSON.stringify({
        model: imageModel,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter API error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    const debugInfo = { prompt, model: imageModel };

    // OpenAI-style: images array on the message object
    if (message?.images && Array.isArray(message.images)) {
      const imagePart = message.images.find(
        (part: { type: string }) => part.type === "image_url" || part.type === "image"
      );
      if (imagePart) {
        const url = imagePart.image_url?.url || imagePart.url;
        return NextResponse.json({ imageUrl: url, _debug: debugInfo });
      }
    }

    // Content as array with image parts
    if (message?.content && Array.isArray(message.content)) {
      const imagePart = message.content.find(
        (part: { type: string }) => part.type === "image_url" || part.type === "image"
      );
      if (imagePart) {
        const url = imagePart.image_url?.url || imagePart.url;
        return NextResponse.json({ imageUrl: url, _debug: debugInfo });
      }
    }

    // Content as a base64 data URL string
    if (message?.content && typeof message.content === "string" && message.content.startsWith("data:image")) {
      return NextResponse.json({ imageUrl: message.content, _debug: debugInfo });
    }

    // Fallback: return whatever we got for debugging
    return NextResponse.json({
      error: "Unexpected response format",
      rawResponse: data,
      _debug: debugInfo,
    }, { status: 500 });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 }
    );
  }
}
