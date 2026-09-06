CREATE TYPE "VideoReferenceProvider" AS ENUM ('YOUTUBE');
CREATE TYPE "VideoAnalysisJobStatus" AS ENUM ('QUEUED', 'ANALYZING', 'COMPLETE', 'FAILED');

CREATE TABLE "video_references" (
  "id" UUID NOT NULL,
  "narrial_user_id" VARCHAR(255) NOT NULL,
  "provider" "VideoReferenceProvider" NOT NULL,
  "provider_video_id" VARCHAR(255) NOT NULL,
  "canonical_url" VARCHAR(2048) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "thumbnail_url" VARCHAR(2048) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "video_references_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "video_references_provider_id_nonempty" CHECK (length("provider_video_id") > 0)
);

CREATE TABLE "video_analysis_jobs" (
  "id" UUID NOT NULL,
  "narrial_user_id" VARCHAR(255) NOT NULL,
  "reference_id" UUID NOT NULL,
  "status" "VideoAnalysisJobStatus" NOT NULL DEFAULT 'QUEUED',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "stage" VARCHAR(255) NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "error_code" VARCHAR(100),
  "claimed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "video_analysis_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "video_analysis_jobs_progress_range" CHECK ("progress" BETWEEN 0 AND 100),
  CONSTRAINT "video_analysis_jobs_attempt_count_range" CHECK ("attempt_count" BETWEEN 0 AND 3),
  CONSTRAINT "video_analysis_jobs_stage_nonempty" CHECK (length("stage") > 0)
);

CREATE TABLE "video_analysis_results" (
  "id" UUID NOT NULL,
  "narrial_user_id" VARCHAR(255) NOT NULL,
  "job_id" UUID NOT NULL,
  "schema_version" INTEGER NOT NULL,
  "prompt_version" VARCHAR(100) NOT NULL,
  "analyzer" VARCHAR(100) NOT NULL,
  "analysis" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "video_analysis_results_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "video_analysis_results_schema_version_positive" CHECK ("schema_version" > 0)
);

CREATE UNIQUE INDEX "video_references_id_narrial_user_id_key" ON "video_references"("id", "narrial_user_id");
CREATE INDEX "video_references_narrial_user_id_created_at_idx" ON "video_references"("narrial_user_id", "created_at" DESC);
CREATE INDEX "video_references_provider_provider_video_id_idx" ON "video_references"("provider", "provider_video_id");
CREATE INDEX "video_references_expires_at_idx" ON "video_references"("expires_at");
CREATE UNIQUE INDEX "video_analysis_jobs_id_narrial_user_id_key" ON "video_analysis_jobs"("id", "narrial_user_id");
CREATE INDEX "video_analysis_jobs_narrial_user_id_status_created_at_idx" ON "video_analysis_jobs"("narrial_user_id", "status", "created_at" DESC);
CREATE INDEX "video_analysis_jobs_status_created_at_idx" ON "video_analysis_jobs"("status", "created_at");
CREATE UNIQUE INDEX "video_analysis_results_job_id_key" ON "video_analysis_results"("job_id");
CREATE UNIQUE INDEX "video_analysis_results_id_narrial_user_id_key" ON "video_analysis_results"("id", "narrial_user_id");
CREATE UNIQUE INDEX "video_analysis_results_job_id_narrial_user_id_key" ON "video_analysis_results"("job_id", "narrial_user_id");
CREATE INDEX "video_analysis_results_narrial_user_id_created_at_idx" ON "video_analysis_results"("narrial_user_id", "created_at" DESC);
CREATE INDEX "video_analysis_results_expires_at_idx" ON "video_analysis_results"("expires_at");

ALTER TABLE "video_analysis_jobs" ADD CONSTRAINT "video_analysis_jobs_reference_id_narrial_user_id_fkey"
FOREIGN KEY ("reference_id", "narrial_user_id") REFERENCES "video_references"("id", "narrial_user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "video_analysis_results" ADD CONSTRAINT "video_analysis_results_job_id_narrial_user_id_fkey"
FOREIGN KEY ("job_id", "narrial_user_id") REFERENCES "video_analysis_jobs"("id", "narrial_user_id") ON DELETE CASCADE ON UPDATE CASCADE;
