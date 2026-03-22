import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    output_modalities: string[];
  };
  pricing: {
    prompt: string;
    completion: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) {
      throw new Error(`OpenRouter API error: ${res.status}`);
    }

    const { data } = await res.json();
    const type = req.nextUrl.searchParams.get("type");

    // Filter by type if specified
    let filtered = (data as OpenRouterModel[]).filter((m) => m.created && m.name);
    if (type === "image") {
      filtered = filtered.filter((m) =>
        m.architecture?.output_modalities?.includes("image")
      );
    }

    // Sort by created date descending, take 20 most recent
    const sorted = filtered
      .sort((a, b) => b.created - a.created)
      .slice(0, 20)
      .map((m) => ({
        id: m.id,
        name: m.name,
        created: m.created,
        contextLength: m.context_length,
        promptPrice: m.pricing?.prompt,
        completionPrice: m.pricing?.completion,
      }));

    return NextResponse.json({ models: sorted });
  } catch (error) {
    console.error("Models API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch models" },
      { status: 500 }
    );
  }
}
