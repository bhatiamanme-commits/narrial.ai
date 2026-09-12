CREATE TYPE "ScriptGenerationJobStatus" AS ENUM ('QUEUED', 'GENERATING', 'COMPLETE', 'FAILED');

ALTER TABLE "video_analysis_jobs" ADD COLUMN "claim_token" UUID;

CREATE TABLE "script_generation_jobs" (
  "id" UUID NOT NULL,
  "narrial_user_id" VARCHAR(255) NOT NULL,
  "analysis_job_id" UUID NOT NULL,
  "idempotency_key" UUID NOT NULL,
  "request_fingerprint" CHAR(64) NOT NULL,
  "prompt" VARCHAR(2000) NOT NULL,
  "question_answers" JSONB NOT NULL,
  "status" "ScriptGenerationJobStatus" NOT NULL DEFAULT 'QUEUED',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "stage" VARCHAR(255) NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "error_code" VARCHAR(100),
  "claimed_at" TIMESTAMPTZ(6),
  "claim_token" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "script_generation_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "script_generation_jobs_progress_range" CHECK ("progress" BETWEEN 0 AND 100),
  CONSTRAINT "script_generation_jobs_attempt_count_range" CHECK ("attempt_count" BETWEEN 0 AND 3),
  CONSTRAINT "script_generation_jobs_stage_nonempty" CHECK (length("stage") > 0),
  CONSTRAINT "script_generation_jobs_prompt_nonempty" CHECK (length("prompt") > 0),
  CONSTRAINT "script_generation_jobs_request_fingerprint_format" CHECK ("request_fingerprint" ~ '^[0-9a-f]{64}$')
);

CREATE TABLE "script_generation_results" (
  "id" UUID NOT NULL,
  "narrial_user_id" VARCHAR(255) NOT NULL,
  "job_id" UUID NOT NULL,
  "schema_version" INTEGER NOT NULL,
  "prompt_version" VARCHAR(100) NOT NULL,
  "planner" VARCHAR(100) NOT NULL,
  "duration_seconds" INTEGER NOT NULL,
  "story" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "script_generation_results_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "script_generation_results_schema_version_positive" CHECK ("schema_version" > 0),
  CONSTRAINT "script_generation_results_duration_positive" CHECK ("duration_seconds" > 0)
);

CREATE UNIQUE INDEX "script_generation_jobs_id_narrial_user_id_key" ON "script_generation_jobs"("id", "narrial_user_id");
CREATE UNIQUE INDEX "script_generation_jobs_narrial_user_id_idempotency_key_key" ON "script_generation_jobs"("narrial_user_id", "idempotency_key");
CREATE INDEX "script_generation_jobs_narrial_user_id_created_at_idx" ON "script_generation_jobs"("narrial_user_id", "created_at");
CREATE INDEX "script_generation_jobs_narrial_user_id_status_created_at_idx" ON "script_generation_jobs"("narrial_user_id", "status", "created_at" DESC);
CREATE INDEX "script_generation_jobs_status_created_at_idx" ON "script_generation_jobs"("status", "created_at");
CREATE UNIQUE INDEX "script_generation_results_job_id_key" ON "script_generation_results"("job_id");
CREATE UNIQUE INDEX "script_generation_results_id_narrial_user_id_key" ON "script_generation_results"("id", "narrial_user_id");
CREATE UNIQUE INDEX "script_generation_results_job_id_narrial_user_id_key" ON "script_generation_results"("job_id", "narrial_user_id");
CREATE INDEX "script_generation_results_narrial_user_id_created_at_idx" ON "script_generation_results"("narrial_user_id", "created_at" DESC);
CREATE INDEX "script_generation_results_expires_at_idx" ON "script_generation_results"("expires_at");

ALTER TABLE "script_generation_jobs" ADD CONSTRAINT "script_generation_jobs_analysis_job_id_narrial_user_id_fkey"
FOREIGN KEY ("analysis_job_id", "narrial_user_id") REFERENCES "video_analysis_jobs"("id", "narrial_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "script_generation_results" ADD CONSTRAINT "script_generation_results_job_id_narrial_user_id_fkey"
FOREIGN KEY ("job_id", "narrial_user_id") REFERENCES "script_generation_jobs"("id", "narrial_user_id") ON DELETE CASCADE ON UPDATE CASCADE;
