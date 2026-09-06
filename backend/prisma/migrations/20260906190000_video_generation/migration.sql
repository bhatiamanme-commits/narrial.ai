CREATE TYPE "VideoGenerationJobStatus" AS ENUM ('STARTING', 'GENERATING', 'COMPLETE', 'FAILED');

CREATE TABLE "video_generation_jobs" (
    "id" UUID NOT NULL,
    "narrial_user_id" VARCHAR(255) NOT NULL,
    "project_id" VARCHAR(100) NOT NULL,
    "prompt" TEXT NOT NULL,
    "aspect_ratio" VARCHAR(10) NOT NULL,
    "status" "VideoGenerationJobStatus" NOT NULL DEFAULT 'STARTING',
    "progress" INTEGER NOT NULL DEFAULT 5,
    "stage" VARCHAR(255) NOT NULL,
    "provider_operation_name" VARCHAR(1024),
    "video_uri" VARCHAR(4096),
    "error_code" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "video_generation_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "video_generation_jobs_provider_operation_name_key" ON "video_generation_jobs"("provider_operation_name");
CREATE UNIQUE INDEX "video_generation_jobs_narrial_user_id_project_id_key" ON "video_generation_jobs"("narrial_user_id", "project_id");
CREATE UNIQUE INDEX "video_generation_jobs_id_narrial_user_id_key" ON "video_generation_jobs"("id", "narrial_user_id");
CREATE INDEX "video_generation_jobs_narrial_user_id_status_created_at_idx" ON "video_generation_jobs"("narrial_user_id", "status", "created_at" DESC);
CREATE INDEX "video_generation_jobs_status_updated_at_idx" ON "video_generation_jobs"("status", "updated_at");
CREATE INDEX "video_generation_jobs_expires_at_idx" ON "video_generation_jobs"("expires_at");
