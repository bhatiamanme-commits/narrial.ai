-- Speeds owner-scoped active-reference deduplication without weakening the
-- transaction-level advisory lock that guarantees concurrent correctness.
CREATE INDEX "video_references_narrial_user_id_provider_provider_video_id_expires_at_idx"
  ON "video_references"("narrial_user_id", "provider", "provider_video_id", "expires_at");
