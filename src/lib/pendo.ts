// Pendo Track Events: a thin, typed wrapper around the Pendo agent's `pendo.track()`.
// The agent is loaded by the Pendo install snippet; when it is absent (local dev,
// ad blockers) tracking is a silent no-op, and a tracking failure never breaks the app.

type PendoEventName =
  | "history_split_completed"
  | "topic_search_completed"
  | "essay_generated"
  | "image_generated"
  | "ai_model_changed"
  | "output_language_changed"
  | "ai_generation_failed";

type PendoPropertyValue = string | number | boolean;

declare global {
  interface Window {
    pendo?: {
      track: (eventName: string, properties?: Record<string, PendoPropertyValue>) => void;
    };
  }
}

// Pendo caps the serialized `{"properties": {...}}` payload at 512 bytes
const MAX_PROPERTIES_BYTES = 512;

function payloadBytes(properties: Record<string, PendoPropertyValue>): number {
  return new TextEncoder().encode(JSON.stringify({ properties })).length;
}

// Drop unset values, then shorten the longest string (LLM output can be long and
// multi-byte) until the payload fits Pendo's limit
function fitPayload(properties: Record<string, PendoPropertyValue | undefined>): Record<string, PendoPropertyValue> {
  const fitted: Record<string, PendoPropertyValue> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined) fitted[key] = value;
  }
  while (payloadBytes(fitted) > MAX_PROPERTIES_BYTES) {
    const [longestKey, longest] = Object.entries(fitted)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .reduce((a, b) => (b[1].length > a[1].length ? b : a), ["", ""]);
    // Nothing left to shorten: send as-is rather than lose the event
    if (longest.length < 2) break;
    fitted[longestKey] = longest.slice(0, Math.floor(longest.length * 0.75));
  }
  return fitted;
}

export function pendoTrack(eventName: PendoEventName, properties: Record<string, PendoPropertyValue | undefined>): void {
  const pendo = typeof window === "undefined" ? undefined : window.pendo;
  if (!pendo || typeof pendo.track !== "function") return;
  try {
    pendo.track(eventName, fitPayload(properties));
  } catch (err) {
    console.warn(`[Pendo] Failed to track "${eventName}":`, err);
  }
}

// Trim free text (search queries, error messages) and cap its length
export function truncate(value: string, maxLength = 100): string {
  return value.trim().slice(0, maxLength);
}

// Total tokens the API routes report under `_debug.usage`
export function getTotalTokens(data: { _debug?: { usage?: { total_tokens?: unknown } } }): number | undefined {
  const total = data._debug?.usage?.total_tokens;
  return typeof total === "number" ? total : undefined;
}

// The API routes and the image client word timeouts as "... timeout: no response within 90s"
export function isTimeoutMessage(message: string): boolean {
  return /timeout/i.test(message);
}

// OpenRouter prices are USD-per-token strings; the model pickers show USD per million tokens
export function pricePerMillion(price: string): number | undefined {
  const perMillion = parseFloat(price) * 1e6;
  return Number.isFinite(perMillion) ? Math.round(perMillion * 1e4) / 1e4 : undefined;
}
