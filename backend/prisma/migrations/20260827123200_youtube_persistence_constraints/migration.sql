ALTER TABLE "youtube_video_sources"
  ADD CONSTRAINT "youtube_video_sources_byte_size_positive" CHECK ("byte_size" > 0),
  ADD CONSTRAINT "youtube_video_sources_version_positive" CHECK ("version" > 0);

ALTER TABLE "youtube_uploads"
  ADD CONSTRAINT "youtube_uploads_progress_valid" CHECK ("total_bytes" > 0 AND "bytes_uploaded" >= 0 AND "bytes_uploaded" <= "total_bytes"),
  ADD CONSTRAINT "youtube_uploads_attempt_count_nonnegative" CHECK ("attempt_count" >= 0),
  ADD CONSTRAINT "youtube_uploads_version_positive" CHECK ("version" > 0);

ALTER TABLE "youtube_publications"
  ADD CONSTRAINT "youtube_publications_title_nonempty" CHECK (length(btrim("title")) > 0),
  ADD CONSTRAINT "youtube_publications_version_positive" CHECK ("version" > 0);

ALTER TABLE "youtube_scheduled_publications"
  ADD CONSTRAINT "youtube_schedules_attempt_count_nonnegative" CHECK ("attempt_count" >= 0),
  ADD CONSTRAINT "youtube_schedules_version_positive" CHECK ("version" > 0),
  ADD CONSTRAINT "youtube_schedules_lease_complete" CHECK (("claimed_at" IS NULL AND "claim_owner" IS NULL AND "claim_expires_at" IS NULL) OR ("claimed_at" IS NOT NULL AND "claim_owner" IS NOT NULL AND "claim_expires_at" IS NOT NULL));

ALTER TABLE "youtube_video_sync_records"
  ADD CONSTRAINT "youtube_sync_failure_count_nonnegative" CHECK ("consecutive_failure_count" >= 0),
  ADD CONSTRAINT "youtube_sync_version_positive" CHECK ("version" > 0);

ALTER TABLE "youtube_idempotency_records"
  ADD CONSTRAINT "youtube_idempotency_expiry_after_creation" CHECK ("expires_at" > "created_at"),
  ADD CONSTRAINT "youtube_idempotency_hashes_nonempty" CHECK (octet_length("idempotency_key_hash") > 0 AND octet_length("request_hash") > 0);

ALTER TABLE "youtube_outbox_events"
  ADD CONSTRAINT "youtube_outbox_payload_version_positive" CHECK ("payload_version" > 0),
  ADD CONSTRAINT "youtube_outbox_attempt_count_nonnegative" CHECK ("attempt_count" >= 0);
