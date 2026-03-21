import { NextRequest, NextResponse } from "next/server";
import { ExploreRequest } from "@/lib/types";
import { splitByTime, splitByGeo, jumpToTopic, generateEssay } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body: ExploreRequest = await req.json();

    switch (body.action) {
      case "split-time": {
        if (!body.node) return NextResponse.json({ error: "Node required" }, { status: 400 });
        const result = await splitByTime(body.node);
        return NextResponse.json(result);
      }
      case "split-geography": {
        if (!body.node) return NextResponse.json({ error: "Node required" }, { status: 400 });
        const result = await splitByGeo(body.node);
        return NextResponse.json(result);
      }
      case "jump-to-topic": {
        if (!body.query) return NextResponse.json({ error: "Query required" }, { status: 400 });
        const result = await jumpToTopic(body.query);
        return NextResponse.json(result);
      }
      case "essay": {
        if (!body.node) return NextResponse.json({ error: "Node required" }, { status: 400 });
        const result = await generateEssay(body.node);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Explore API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
