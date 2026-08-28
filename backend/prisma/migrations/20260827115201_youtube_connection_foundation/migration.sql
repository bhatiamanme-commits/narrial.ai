-- CreateEnum
CREATE TYPE "YouTubeConnectionStatus" AS ENUM ('UNKNOWN', 'PENDING_AUTHORIZATION', 'VERIFYING', 'CONNECTED', 'INSUFFICIENT_PERMISSION', 'RECONNECT_REQUIRED', 'DISCONNECTING', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "YouTubeCredentialStatus" AS ENUM ('AVAILABLE', 'MISSING', 'EXPIRED', 'REVOKED', 'INVALID');

-- CreateEnum
CREATE TYPE "YouTubeOAuthTransactionStatus" AS ENUM ('CREATED', 'AUTHORIZATION_PENDING', 'CALLBACK_RECEIVED', 'CONSUMING', 'COMPLETED', 'DENIED', 'EXPIRED', 'FAILED', 'REPLAY_REJECTED');

-- CreateTable
CREATE TABLE "youtube_connections" (
    "id" UUID NOT NULL,
    "narrial_user_id" VARCHAR(255) NOT NULL,
    "youtube_channel_id" VARCHAR(255) NOT NULL,
    "channel_title" VARCHAR(255) NOT NULL,
    "channel_handle" VARCHAR(255),
    "channel_thumbnail_url" TEXT,
    "status" "YouTubeConnectionStatus" NOT NULL DEFAULT 'PENDING_AUTHORIZATION',
    "credential_status" "YouTubeCredentialStatus" NOT NULL DEFAULT 'MISSING',
    "last_verified_at" TIMESTAMPTZ(6),
    "last_provider_sync_at" TIMESTAMPTZ(6),
    "reauthorization_required_at" TIMESTAMPTZ(6),
    "disconnected_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "youtube_connections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "youtube_connections_version_positive" CHECK ("version" > 0),
    CONSTRAINT "youtube_connections_channel_title_nonempty" CHECK (length(btrim("channel_title")) > 0),
    CONSTRAINT "youtube_connections_disconnected_at_required" CHECK ("status" <> 'DISCONNECTED' OR "disconnected_at" IS NOT NULL)
);

-- CreateTable
CREATE TABLE "youtube_connection_credentials" (
    "connection_id" UUID NOT NULL,
    "ciphertext" BYTEA NOT NULL,
    "initialization_vector" BYTEA NOT NULL,
    "authentication_tag" BYTEA,
    "key_version" VARCHAR(255) NOT NULL,
    "credential_schema_version" INTEGER NOT NULL,
    "access_token_expires_at" TIMESTAMPTZ(6),
    "has_refresh_token" BOOLEAN NOT NULL,
    "last_refreshed_at" TIMESTAMPTZ(6),
    "refresh_failure_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "youtube_connection_credentials_pkey" PRIMARY KEY ("connection_id"),
    CONSTRAINT "youtube_credentials_schema_version_positive" CHECK ("credential_schema_version" > 0),
    CONSTRAINT "youtube_credentials_refresh_failure_count_nonnegative" CHECK ("refresh_failure_count" >= 0),
    CONSTRAINT "youtube_credentials_key_version_nonempty" CHECK (length(btrim("key_version")) > 0)
);

-- CreateTable
CREATE TABLE "youtube_connection_scopes" (
    "connection_id" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL,
    "last_verified_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "youtube_connection_scopes_pkey" PRIMARY KEY ("connection_id","scope")
);

-- CreateTable
CREATE TABLE "youtube_oauth_transactions" (
    "id" UUID NOT NULL,
    "narrial_user_id" VARCHAR(255) NOT NULL,
    "state_hash" BYTEA NOT NULL,
    "status" "YouTubeOAuthTransactionStatus" NOT NULL DEFAULT 'CREATED',
    "return_destination" VARCHAR(255) NOT NULL,
    "requested_scopes" JSONB NOT NULL,
    "pkce_verifier_ciphertext" BYTEA,
    "pkce_key_version" VARCHAR(255),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "failure_category" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "youtube_oauth_transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "youtube_oauth_expiry_after_creation" CHECK ("expires_at" > "created_at"),
    CONSTRAINT "youtube_oauth_pkce_fields_complete" CHECK (("pkce_verifier_ciphertext" IS NULL) = ("pkce_key_version" IS NULL))
);

-- CreateTable
CREATE TABLE "youtube_status_events" (
    "id" UUID NOT NULL,
    "narrial_user_id" VARCHAR(255) NOT NULL,
    "aggregate_type" VARCHAR(100) NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "from_status" VARCHAR(100),
    "to_status" VARCHAR(100) NOT NULL,
    "reason" VARCHAR(255),
    "source" VARCHAR(100) NOT NULL,
    "request_id" VARCHAR(255),
    "job_id" UUID,
    "safe_metadata" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "youtube_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_audit_events" (
    "id" UUID NOT NULL,
    "narrial_user_id" VARCHAR(255) NOT NULL,
    "actor_type" VARCHAR(100) NOT NULL,
    "actor_id" VARCHAR(255),
    "event_type" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(100) NOT NULL,
    "target_id" UUID NOT NULL,
    "outcome" VARCHAR(100) NOT NULL,
    "request_id" VARCHAR(255),
    "safe_metadata" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "youtube_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "youtube_connections_narrial_user_id_status_updated_at_idx" ON "youtube_connections"("narrial_user_id", "status", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "youtube_connections_youtube_channel_id_idx" ON "youtube_connections"("youtube_channel_id");

-- CreateIndex
CREATE INDEX "youtube_connections_status_last_provider_sync_at_idx" ON "youtube_connections"("status", "last_provider_sync_at");

-- CreateIndex
CREATE INDEX "youtube_connections_credential_status_reauthorization_requi_idx" ON "youtube_connections"("credential_status", "reauthorization_required_at");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_connections_narrial_user_id_youtube_channel_id_key" ON "youtube_connections"("narrial_user_id", "youtube_channel_id");

-- CreateIndex
CREATE INDEX "youtube_connection_credentials_access_token_expires_at_idx" ON "youtube_connection_credentials"("access_token_expires_at");

-- CreateIndex
CREATE INDEX "youtube_connection_credentials_key_version_idx" ON "youtube_connection_credentials"("key_version");

-- CreateIndex
CREATE INDEX "youtube_connection_credentials_refresh_failure_count_update_idx" ON "youtube_connection_credentials"("refresh_failure_count", "updated_at");

-- CreateIndex
CREATE INDEX "youtube_connection_scopes_scope_idx" ON "youtube_connection_scopes"("scope");

-- CreateIndex
CREATE INDEX "youtube_connection_scopes_connection_id_last_verified_at_idx" ON "youtube_connection_scopes"("connection_id", "last_verified_at");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_oauth_transactions_state_hash_key" ON "youtube_oauth_transactions"("state_hash");

-- CreateIndex
CREATE INDEX "youtube_oauth_transactions_narrial_user_id_status_created_a_idx" ON "youtube_oauth_transactions"("narrial_user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "youtube_oauth_transactions_status_expires_at_idx" ON "youtube_oauth_transactions"("status", "expires_at");

-- CreateIndex
CREATE INDEX "youtube_status_events_narrial_user_id_occurred_at_idx" ON "youtube_status_events"("narrial_user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "youtube_status_events_aggregate_type_aggregate_id_occurred__idx" ON "youtube_status_events"("aggregate_type", "aggregate_id", "occurred_at");

-- CreateIndex
CREATE INDEX "youtube_audit_events_narrial_user_id_occurred_at_idx" ON "youtube_audit_events"("narrial_user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "youtube_audit_events_target_type_target_id_occurred_at_idx" ON "youtube_audit_events"("target_type", "target_id", "occurred_at");

-- CreateIndex
CREATE INDEX "youtube_audit_events_event_type_occurred_at_idx" ON "youtube_audit_events"("event_type", "occurred_at");

-- AddForeignKey
ALTER TABLE "youtube_connection_credentials" ADD CONSTRAINT "youtube_connection_credentials_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "youtube_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youtube_connection_scopes" ADD CONSTRAINT "youtube_connection_scopes_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "youtube_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
