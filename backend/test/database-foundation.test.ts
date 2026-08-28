import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const schemaPath = new URL("../prisma/schema.prisma", import.meta.url);
const migrationPath = new URL(
  "../prisma/migrations/20260827115201_youtube_connection_foundation/migration.sql",
  import.meta.url,
);

describe("YouTube persistence foundation", () => {
  it("defines only the approved foundation models with explicit ownership", async () => {
    const schema = await readFile(schemaPath, "utf8");

    for (const model of [
      "YouTubeConnection",
      "YouTubeConnectionCredential",
      "YouTubeConnectionScope",
      "YouTubeOAuthTransaction",
      "YouTubeStatusEvent",
      "YouTubeAuditEvent",
      "YouTubeVideoSource",
      "YouTubeUpload",
      "YouTubePublication",
      "YouTubeScheduledPublication",
      "YouTubeVideoSyncRecord",
      "YouTubeIdempotencyRecord",
      "YouTubeOutboxEvent",
    ]) {
      expect(schema).toContain(`model ${model} {`);
    }

    expect(schema).toContain('@map("narrial_user_id")');
    expect(schema).not.toMatch(/Instagram|TikTok|Facebook|MultiPlatform/i);
  });

  it("keeps credential and OAuth secrets out of plaintext columns", async () => {
    const schema = await readFile(schemaPath, "utf8");

    expect(schema).toContain('@map("ciphertext")');
    expect(schema).toContain('@map("state_hash")');
    expect(schema).not.toMatch(/\b(accessToken|refreshToken|authorizationCode|rawState)\b/);
  });

  it("enforces foundation invariants in PostgreSQL", async () => {
    const migration = await readFile(migrationPath, "utf8");

    for (const constraint of [
      "youtube_connections_version_positive",
      "youtube_connections_channel_title_nonempty",
      "youtube_credentials_schema_version_positive",
      "youtube_credentials_refresh_failure_count_nonnegative",
      "youtube_oauth_expiry_after_creation",
      "youtube_oauth_pkce_fields_complete",
    ]) {
      expect(migration).toContain(`CONSTRAINT "${constraint}"`);
    }
  });
});
