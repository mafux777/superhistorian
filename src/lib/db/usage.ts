// Token usage logging
import { getDb } from "./client";

export interface LogUsageParams {
  nodeId?: string | null;
  action: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd?: number | null;
}

export async function logUsage(params: LogUsageParams): Promise<void> {
  const db = await getDb();
  await db.query(
    `CREATE llm_usage SET
      node_id = $node_id,
      action = $action,
      model = $model,
      prompt_tokens = $prompt_tokens,
      completion_tokens = $completion_tokens,
      total_tokens = $total_tokens,
      cost_usd = $cost_usd
    `,
    {
      node_id: params.nodeId || null,
      action: params.action,
      model: params.model,
      prompt_tokens: params.prompt_tokens,
      completion_tokens: params.completion_tokens,
      total_tokens: params.total_tokens,
      cost_usd: params.cost_usd ?? null,
    }
  );
}

export async function getUsageStats(): Promise<{
  totalTokens: number;
  totalCost: number;
  byModel: Record<string, { tokens: number; calls: number }>;
}> {
  const db = await getDb();
  const result = await db.query<[Array<Record<string, unknown>>]>(
    `SELECT
      math::sum(total_tokens) as total_tokens,
      math::sum(cost_usd) as total_cost,
      model,
      count() as calls
    FROM llm_usage GROUP BY model`
  );

  const rows = result[0] || [];
  let totalTokens = 0;
  let totalCost = 0;
  const byModel: Record<string, { tokens: number; calls: number }> = {};

  for (const row of rows) {
    const tokens = Number(row.total_tokens || 0);
    const cost = Number(row.total_cost || 0);
    const model = String(row.model || "unknown");
    const calls = Number(row.calls || 0);
    totalTokens += tokens;
    totalCost += cost;
    byModel[model] = { tokens, calls };
  }

  return { totalTokens, totalCost, byModel };
}
