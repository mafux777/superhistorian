// Database-specific types with metadata fields

export interface DbHistoryNode {
  id: string;
  title: string;
  summary: string;
  time_range_start: string;
  time_range_end: string;
  geographic_scope: string;
  split_axis: "time" | "geography" | null;
  depth: number;
  essay: string | null;
  created_at: string;
  llm_model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  image_path: string | null;
  image_model: string | null;
}

export interface DbLlmUsage {
  id?: string;
  node_id: string | null;
  action: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number | null;
  created_at: string;
}

export interface LlmUsageData {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
