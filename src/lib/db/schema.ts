// Schema initialization for SurrealDB
import { getDb } from "./client";

export async function initializeSchema(): Promise<void> {
  const db = await getDb();

  await db.query(`
    DEFINE TABLE IF NOT EXISTS history_node SCHEMAFULL;
    DEFINE FIELD IF NOT EXISTS title ON history_node TYPE string;
    DEFINE FIELD IF NOT EXISTS summary ON history_node TYPE string;
    DEFINE FIELD IF NOT EXISTS time_range_start ON history_node TYPE string;
    DEFINE FIELD IF NOT EXISTS time_range_end ON history_node TYPE string;
    DEFINE FIELD IF NOT EXISTS geographic_scope ON history_node TYPE string;
    DEFINE FIELD IF NOT EXISTS split_axis ON history_node TYPE option<string>;
    DEFINE FIELD IF NOT EXISTS depth ON history_node TYPE int;
    DEFINE FIELD IF NOT EXISTS essay ON history_node TYPE option<string>;
    DEFINE FIELD IF NOT EXISTS created_at ON history_node TYPE datetime DEFAULT time::now();
    DEFINE FIELD IF NOT EXISTS llm_model ON history_node TYPE string DEFAULT '';
    DEFINE FIELD IF NOT EXISTS prompt_tokens ON history_node TYPE option<int>;
    DEFINE FIELD IF NOT EXISTS completion_tokens ON history_node TYPE option<int>;
    DEFINE FIELD IF NOT EXISTS total_tokens ON history_node TYPE option<int>;
    DEFINE FIELD IF NOT EXISTS image_path ON history_node TYPE option<string>;
    DEFINE FIELD IF NOT EXISTS image_model ON history_node TYPE option<string>;

    DEFINE TABLE IF NOT EXISTS parent_of SCHEMAFULL TYPE RELATION IN history_node OUT history_node;
    DEFINE FIELD IF NOT EXISTS child_order ON parent_of TYPE int DEFAULT 0;
    DEFINE FIELD IF NOT EXISTS created_at ON parent_of TYPE datetime DEFAULT time::now();

    DEFINE TABLE IF NOT EXISTS llm_usage SCHEMAFULL;
    DEFINE FIELD IF NOT EXISTS node_id ON llm_usage TYPE option<string>;
    DEFINE FIELD IF NOT EXISTS action ON llm_usage TYPE string;
    DEFINE FIELD IF NOT EXISTS model ON llm_usage TYPE string;
    DEFINE FIELD IF NOT EXISTS prompt_tokens ON llm_usage TYPE int DEFAULT 0;
    DEFINE FIELD IF NOT EXISTS completion_tokens ON llm_usage TYPE int DEFAULT 0;
    DEFINE FIELD IF NOT EXISTS total_tokens ON llm_usage TYPE int DEFAULT 0;
    DEFINE FIELD IF NOT EXISTS cost_usd ON llm_usage TYPE option<float>;
    DEFINE FIELD IF NOT EXISTS created_at ON llm_usage TYPE datetime DEFAULT time::now();
  `);

  console.log("[SurrealDB] Schema initialized");
}
