ALTER TABLE "youtube_publications" DROP CONSTRAINT "youtube_publications_connection_id_fkey";
ALTER TABLE "youtube_publications" DROP CONSTRAINT "youtube_publications_upload_id_fkey";
ALTER TABLE "youtube_scheduled_publications" DROP CONSTRAINT "youtube_scheduled_publications_connection_id_fkey";
ALTER TABLE "youtube_scheduled_publications" DROP CONSTRAINT "youtube_scheduled_publications_publication_id_fkey";
ALTER TABLE "youtube_uploads" DROP CONSTRAINT "youtube_uploads_connection_id_fkey";
ALTER TABLE "youtube_uploads" DROP CONSTRAINT "youtube_uploads_video_source_id_fkey";
ALTER TABLE "youtube_video_sync_records" DROP CONSTRAINT "youtube_video_sync_records_publication_id_fkey";

CREATE UNIQUE INDEX "youtube_connections_id_narrial_user_id_key" ON "youtube_connections"("id", "narrial_user_id");
CREATE UNIQUE INDEX "youtube_publications_id_narrial_user_id_key" ON "youtube_publications"("id", "narrial_user_id");
CREATE UNIQUE INDEX "youtube_publications_upload_id_narrial_user_id_key" ON "youtube_publications"("upload_id", "narrial_user_id");
CREATE UNIQUE INDEX "youtube_scheduled_publications_publication_id_narrial_user__key" ON "youtube_scheduled_publications"("publication_id", "narrial_user_id");
CREATE UNIQUE INDEX "youtube_uploads_id_narrial_user_id_key" ON "youtube_uploads"("id", "narrial_user_id");
CREATE UNIQUE INDEX "youtube_video_sources_id_narrial_user_id_key" ON "youtube_video_sources"("id", "narrial_user_id");
CREATE UNIQUE INDEX "youtube_video_sync_records_publication_id_narrial_user_id_key" ON "youtube_video_sync_records"("publication_id", "narrial_user_id");

ALTER TABLE "youtube_uploads" ADD CONSTRAINT "youtube_uploads_connection_id_narrial_user_id_fkey" FOREIGN KEY ("connection_id", "narrial_user_id") REFERENCES "youtube_connections"("id", "narrial_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "youtube_uploads" ADD CONSTRAINT "youtube_uploads_video_source_id_narrial_user_id_fkey" FOREIGN KEY ("video_source_id", "narrial_user_id") REFERENCES "youtube_video_sources"("id", "narrial_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "youtube_publications" ADD CONSTRAINT "youtube_publications_connection_id_narrial_user_id_fkey" FOREIGN KEY ("connection_id", "narrial_user_id") REFERENCES "youtube_connections"("id", "narrial_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "youtube_publications" ADD CONSTRAINT "youtube_publications_upload_id_narrial_user_id_fkey" FOREIGN KEY ("upload_id", "narrial_user_id") REFERENCES "youtube_uploads"("id", "narrial_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "youtube_scheduled_publications" ADD CONSTRAINT "youtube_scheduled_publications_connection_id_narrial_user__fkey" FOREIGN KEY ("connection_id", "narrial_user_id") REFERENCES "youtube_connections"("id", "narrial_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "youtube_scheduled_publications" ADD CONSTRAINT "youtube_scheduled_publications_publication_id_narrial_user_fkey" FOREIGN KEY ("publication_id", "narrial_user_id") REFERENCES "youtube_publications"("id", "narrial_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "youtube_video_sync_records" ADD CONSTRAINT "youtube_video_sync_records_publication_id_narrial_user_id_fkey" FOREIGN KEY ("publication_id", "narrial_user_id") REFERENCES "youtube_publications"("id", "narrial_user_id") ON DELETE CASCADE ON UPDATE CASCADE;
