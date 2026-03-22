import { HistoryNode } from "./types";
import { mockSplitByTime, mockSplitByGeo, mockJumpToTopic, mockEssay } from "./mock-data";

const USE_MOCK = !process.env.OPENROUTER_API_KEY;

async function callOpenRouter(prompt: string, model?: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://superhistorian.vercel.app",
      "X-Title": "Super Historian",
    },
    body: JSON.stringify({
      model: model || process.env.OPENROUTER_MODEL || "openai/gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  let content = data.choices[0].message.content;
  // Strip markdown code fences if the model wraps JSON in ```json ... ```
  content = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  return content;
}

export async function splitByTime(node: HistoryNode, model?: string, language?: string) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    return { ...mockSplitByTime(node), _debug: { prompt: "(mock mode)", model: "mock" } };
  }

  const { buildSplitByTimePrompt } = await import("./prompts");
  const prompt = buildSplitByTimePrompt(node, language);
  const raw = await callOpenRouter(prompt, model);
  return { ...JSON.parse(raw), _debug: { prompt, model: model || process.env.OPENROUTER_MODEL || "openai/gpt-5-nano" } };
}

export async function splitByGeo(node: HistoryNode, model?: string, language?: string) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    return { ...mockSplitByGeo(node), _debug: { prompt: "(mock mode)", model: "mock" } };
  }

  const { buildSplitByGeoPrompt } = await import("./prompts");
  const prompt = buildSplitByGeoPrompt(node, language);
  const raw = await callOpenRouter(prompt, model);
  return { ...JSON.parse(raw), _debug: { prompt, model: model || process.env.OPENROUTER_MODEL || "openai/gpt-5-nano" } };
}

export async function jumpToTopic(query: string, model?: string, language?: string) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    return { ...mockJumpToTopic(query), _debug: { prompt: "(mock mode)", model: "mock" } };
  }

  const { buildJumpToTopicPrompt } = await import("./prompts");
  const prompt = buildJumpToTopicPrompt(query, language);
  const raw = await callOpenRouter(prompt, model);
  return { ...JSON.parse(raw), _debug: { prompt, model: model || process.env.OPENROUTER_MODEL || "openai/gpt-5-nano" } };
}

export async function generateEssay(node: HistoryNode, model?: string, language?: string) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    return { ...mockEssay(node), _debug: { prompt: "(mock mode)", model: "mock" } };
  }

  const { buildEssayPrompt } = await import("./prompts");
  const prompt = buildEssayPrompt(node, language);
  const raw = await callOpenRouter(prompt, model);
  return { ...JSON.parse(raw), _debug: { prompt, model: model || process.env.OPENROUTER_MODEL || "openai/gpt-5-nano" } };
}
