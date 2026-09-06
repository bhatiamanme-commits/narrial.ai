import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const schemaPath = new URL('../prisma/schema.prisma', import.meta.url);
const migrationPath = new URL('../prisma/migrations/20260906151000_video_link_analysis/migration.sql', import.meta.url);

describe('video analysis persistence', () => {
  it('stores user-owned references, durable jobs, and versioned results', async () => {
    const schema = await readFile(schemaPath, 'utf8');
    for (const model of ['VideoReference', 'VideoAnalysisJob', 'VideoAnalysisResult']) {
      expect(schema).toContain(`model ${model} {`);
    }
    expect(schema).toContain('@@unique([id, narrialUserId])');
    expect(schema).toContain('schemaVersion');
  });

  it('enforces progress, attempts, and one-result-per-job invariants', async () => {
    const migration = await readFile(migrationPath, 'utf8');
    expect(migration).toContain('video_analysis_jobs_progress_range');
    expect(migration).toContain('video_analysis_jobs_attempt_count_range');
    expect(migration).toContain('video_analysis_results_job_id_key');
  });
});
