import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.loadEnvFile();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 2_000,
  max: 1,
});

beforeAll(async () => {
  await pool.query("SELECT 1");
});

afterAll(async () => {
  await pool.end();
});

describe("YouTube foundation migration", () => {
  it("creates exactly the approved application tables", async () => {
    const result = await pool.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'youtube_%'
      ORDER BY table_name
    `);

    expect(result.rows.map(({ table_name }) => table_name)).toEqual([
      "youtube_audit_events",
      "youtube_connection_credentials",
      "youtube_connection_scopes",
      "youtube_connections",
      "youtube_idempotency_records",
      "youtube_oauth_transactions",
      "youtube_outbox_events",
      "youtube_publications",
      "youtube_scheduled_publications",
      "youtube_status_events",
      "youtube_uploads",
      "youtube_video_sources",
      "youtube_video_sync_records",
    ]);
  });

  it("applies the reviewed ownership and secret-safety constraints", async () => {
    const result = await pool.query<{ constraint_name: string }>(`
      SELECT conname AS constraint_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      UNION
      SELECT indexname AS constraint_name
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY constraint_name
    `);
    const names = result.rows.map(({ constraint_name }) => constraint_name);

    expect(names).toEqual(expect.arrayContaining([
      "youtube_connections_narrial_user_id_youtube_channel_id_key",
      "youtube_connections_version_positive",
      "youtube_credentials_schema_version_positive",
      "youtube_credentials_refresh_failure_count_nonnegative",
      "youtube_oauth_expiry_after_creation",
      "youtube_oauth_pkce_fields_complete",
      "youtube_oauth_transactions_state_hash_key",
      "youtube_idempotency_records_narrial_user_id_operation_type__key",
      "youtube_uploads_connection_id_narrial_user_id_fkey",
      "youtube_uploads_video_source_id_narrial_user_id_fkey",
      "youtube_uploads_progress_valid",
      "youtube_schedules_lease_complete",
      "youtube_idempotency_hashes_nonempty",
      "youtube_outbox_payload_version_positive",
    ]));
  });
});
