import { HistoryNode } from "./types";
import { mockSplitByTime, mockSplitByGeo, mockJumpToTopic, mockEssay } from "./mock-data";

const USE_MOCK = !process.env.OPENROUTER_API_KEY;

async function callOpenRouter(prompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://superhistorian.vercel.app",
      "X-Title": "Super Historian",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export async function splitByTime(node: HistoryNode) {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    return mockSplitByTime(node);
  }

  const { buildSplitByTimePrompt } = await import("./prompts");
  const raw = await callOpenRouter(buildSplitByTimePrompt(node));
  return JSON.parse(raw);
}

export async function splitByGeo(node: HistoryNode) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    return mockSplitByGeo(node);
  }

  const { buildSplitByGeoPrompt } = await import("./prompts");
  const raw = await callOpenRouter(buildSplitByGeoPrompt(node));
  return JSON.parse(raw);
}

export async function jumpToTopic(query: string) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    return mockJumpToTopic(query);
  }

  const { buildJumpToTopicPrompt } = await import("./prompts");
  const raw = await callOpenRouter(buildJumpToTopicPrompt(query));
  return JSON.parse(raw);
}

export async function generateEssay(node: HistoryNode) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    return mockEssay(node);
  }

  const { buildEssayPrompt } = await import("./prompts");
  const raw = await callOpenRouter(buildEssayPrompt(node));
  return JSON.parse(raw);
}
