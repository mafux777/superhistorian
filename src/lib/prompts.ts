import { HistoryNode } from "./types";

function langInstruction(language: string): string {
  if (language === "English") return "";
  return `\n\nRespond entirely in ${language}. All titles, summaries, and text content must be in ${language}. JSON keys must remain in English.`;
}

export function buildSplitByTimePrompt(node: HistoryNode, language: string = "English"): string {
  return `You are a historian. Given the following historical period, divide it into 3 to 6 sequential sub-periods (including an "Other" category for anything that doesn't fit neatly). For each, provide:
- title (short, evocative name)
- start and end dates
- summary (2-3 sentences)

Period: ${node.title}
Time range: ${node.timeRange.start} to ${node.timeRange.end}
Geographic scope: ${node.geographicScope}
Context: ${node.summary}

Respond in JSON: { "phases": [{ "title", "start", "end", "summary" }] }${langInstruction(language)}`;
}

export function buildSplitByGeoPrompt(node: HistoryNode, language: string = "English"): string {
  return `You are a historian. Given the following historical period and region, divide the geographic scope into 3 to 6 meaningful sub-regions for this era (including an "Other" category for anything that doesn't fit neatly). For each, provide:
- regionName
- summary of what was happening there during this period (2-3 sentences)

Period: ${node.title}
Time range: ${node.timeRange.start} to ${node.timeRange.end}
Current scope: ${node.geographicScope}
Context: ${node.summary}

Respond in JSON: { "regions": [{ "regionName", "summary" }] }${langInstruction(language)}`;
}

export function buildJumpToTopicPrompt(query: string, language: string = "English"): string {
  return `You are a historian. The user wants to explore: "${query}"

Provide:
- title
- start and end dates
- geographic scope (e.g. "Europe", "Global", "Japan")
- summary (3-4 sentences)

Respond in JSON: { "title", "start", "end", "geographicScope", "summary" }${langInstruction(language)}`;
}

export function buildEssayPrompt(node: HistoryNode, language: string = "English"): string {
  return `You are a brilliant, engaging historian and writer. Write a 350-word essay about the following topic. Make it vivid, insightful, and compelling — the kind of essay that makes the reader feel like they were there.

Topic: ${node.title}
Time period: ${node.timeRange.start} to ${node.timeRange.end}
Geographic scope: ${node.geographicScope}
Context: ${node.summary}

Write exactly 350 words. Be specific with names, dates, and details. Make it narrative and engaging.

Respond in JSON: { "essay": "..." }${langInstruction(language)}`;
}
