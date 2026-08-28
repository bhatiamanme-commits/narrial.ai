-- CreateEnum
CREATE TYPE "YouTubeIdempotencyStatus" AS ENUM ('CLAIMED', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED_RETRYABLE', 'FAILED_TERMINAL', 'OUTCOME_UNKNOWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "YouTubeUploadStatus" AS ENUM ('DRAFT', 'VALIDATING', 'READY', 'QUEUED', 'SESSION_CREATING', 'UPLOADING', 'INTERRUPTED', 'CANCELLING', 'CANCELLED', 'TRANSFERRED', 'FAILED', 'OUTCOME_UNKNOWN');

-- CreateEnum
CREATE TYPE "YouTubePublicationStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'RESTRICTED', 'PRIVATE', 'OUTCOME_UNKNOWN', 'DELETED');

-- CreateEnum
CREATE TYPE "YouTubeScheduleStatus" AS ENUM ('DRAFT', 'SCHEDULING', 'SCHEDULED', 'RESCHEDULING', 'CANCELLING', 'CANCELLED', 'DUE', 'EXECUTING', 'RETRY_WAIT', 'PUBLISHED', 'FAILED', 'MISSED', 'OUTCOME_UNKNOWN');

-- CreateEnum
CREATE TYPE "YouTubeSyncStatus" AS ENUM ('NOT_REQUIRED', 'DUE', 'IN_PROGRESS', 'CURRENT', 'STALE', 'RETRY_WAIT', 'BLOCKED_BY_CREDENTIALS', 'BLOCKED_BY_QUOTA', 'FAILED');

-- CreateEnum
CREATE TYPE "YouTubeOutboxStatus" AS ENUM ('PENDING', 'CLAIMED', 'PUBLISHED', 'FAILED_RETRYABLE', 'FAILED_TERMINAL');

-- CreateTable
CREATE TABLE "youtube_video_sources" (
    "id" UUID NOT NULL,
    "narrial_user_id" VARCHAR(255) NOT NULL,
    "storage_object_key" VARCHAR(512) NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(255) NOT NULL,
    "byte_size" BIGINT NOT NULL,
    "checksum_sha256" BYTEA NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "youtube_video_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_uploads" (
    "id" UUID NOT NULL,
    "narrial_user_id" VARCHAR(255) NOT NULL,
    "connection_id" UUID NOT NULL,
    "video_source_id" UUID NOT NULL,
    "youtube_video_id" VARCHAR(255),
    "status" "YouTubeUploadStatus" NOT NULL DEFAULT 'QUEUED',
    "bytes_uploaded" BIGINT NOT NULL DEFAULT 0,
    "total_bytes" BIGINT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "youtube_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_publications" (
    "id" UUID NOT NULL,
    "narrial_user_id" VARCHAR(255) NOT NULL,
    "connection_id" UUID NOT NULL,
    "upload_id" UUID NOT NULL,
    "youtube_video_id" VARCHAR(255),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "privacy_status" VARCHAR(50) NOT NULL,
    "status" "YouTubePublicationStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "youtube_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_scheduled_publications" (
    "id" UUID NOT NULL,
    "narrial_user_id" VARCHAR(255) NOT NULL,
    "connection_id" UUID NOT NULL,
    "publication_id" UUID NOT NULL,
    "scheduled_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "display_timezone" VARCHAR(255) NOT NULL,
    "status" "YouTubeScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "claimed_at" TIMESTAMPTZ(6),
    "claim_owner" VARCHAR(255),
    "claim_expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "youtube_scheduled_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_video_sync_records" (
    "id" UUID NOT NULL,
    "narrial_user_id" VARCHAR(255) NOT NULL,
    "publication_id" UUID NOT NULL,
    "youtube_video_id" VARCHAR(255) NOT NULL,
    "status" "YouTubeSyncStatus" NOT NULL DEFAULT 'DUE',
    "next_sync_at" TIMESTAMPTZ(6) NOT NULL,
    "consecutive_failure_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "youtube_video_sync_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_idempotency_records" (
    "id" UUID NOT NULL,
    "narrial_user_id" VARCHAR(255) NOT NULL,
    "operation_type" VARCHAR(100) NOT NULL,
    "idempotency_key_hash" BYTEA NOT NULL,
    "request_hash" BYTEA NOT NULL,
    "status" "YouTubeIdempotencyStatus" NOT NULL DEFAULT 'CLAIMED',
    "resource_type" VARCHAR(100),
    "resource_id" UUID,
    "safe_response" JSONB,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "youtube_idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_outbox_events" (
    "id" UUID NOT NULL,
    "narrial_user_id" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "aggregate_type" VARCHAR(100) NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "payload_version" INTEGER NOT NULL,
    "safe_payload" JSONB NOT NULL,
    "status" "YouTubeOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "youtube_outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "youtube_video_sources_narrial_user_id_status_created_at_idx" ON "youtube_video_sources"("narrial_user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "youtube_video_sources_narrial_user_id_storage_object_key_key" ON "youtube_video_sources"("narrial_user_id", "storage_object_key");

-- CreateIndex
CREATE INDEX "youtube_uploads_narrial_user_id_status_created_at_idx" ON "youtube_uploads"("narrial_user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "youtube_uploads_connection_id_status_created_at_idx" ON "youtube_uploads"("connection_id", "status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "youtube_publications_upload_id_key" ON "youtube_publications"("upload_id");

-- CreateIndex
CREATE INDEX "youtube_publications_narrial_user_id_status_created_at_idx" ON "youtube_publications"("narrial_user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "youtube_scheduled_publications_publication_id_key" ON "youtube_scheduled_publications"("publication_id");

-- CreateIndex
CREATE INDEX "youtube_scheduled_publications_status_scheduled_at_utc_idx" ON "youtube_scheduled_publications"("status", "scheduled_at_utc");

-- CreateIndex
CREATE INDEX "youtube_scheduled_publications_narrial_user_id_status_sched_idx" ON "youtube_scheduled_publications"("narrial_user_id", "status", "scheduled_at_utc");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_video_sync_records_publication_id_key" ON "youtube_video_sync_records"("publication_id");

-- CreateIndex
CREATE INDEX "youtube_video_sync_records_status_next_sync_at_idx" ON "youtube_video_sync_records"("status", "next_sync_at");

-- CreateIndex
CREATE INDEX "youtube_video_sync_records_narrial_user_id_updated_at_idx" ON "youtube_video_sync_records"("narrial_user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "youtube_idempotency_records_status_expires_at_idx" ON "youtube_idempotency_records"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_idempotency_records_narrial_user_id_operation_type__key" ON "youtube_idempotency_records"("narrial_user_id", "operation_type", "idempotency_key_hash");

-- CreateIndex
CREATE INDEX "youtube_outbox_events_status_available_at_idx" ON "youtube_outbox_events"("status", "available_at");

-- CreateIndex
CREATE INDEX "youtube_outbox_events_narrial_user_id_status_idx" ON "youtube_outbox_events"("narrial_user_id", "status");

-- AddForeignKey
ALTER TABLE "youtube_uploads" ADD CONSTRAINT "youtube_uploads_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "youtube_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youtube_uploads" ADD CONSTRAINT "youtube_uploads_video_source_id_fkey" FOREIGN KEY ("video_source_id") REFERENCES "youtube_video_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youtube_publications" ADD CONSTRAINT "youtube_publications_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "youtube_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youtube_publications" ADD CONSTRAINT "youtube_publications_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "youtube_uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youtube_scheduled_publications" ADD CONSTRAINT "youtube_scheduled_publications_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "youtube_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youtube_scheduled_publications" ADD CONSTRAINT "youtube_scheduled_publications_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "youtube_publications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youtube_video_sync_records" ADD CONSTRAINT "youtube_video_sync_records_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "youtube_publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
