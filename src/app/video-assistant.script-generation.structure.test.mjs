import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source() {
  return readFile(new URL('./video-assistant.tsx', import.meta.url), 'utf8');
}

test('persists the normalized durable request before creating a script job', async () => {
  const screen = await source();
  const createEffect = screen.slice(screen.indexOf('const canCreateFromCompletedAnalysis'), screen.indexOf('useEffect(() => {', screen.indexOf('const canCreateFromCompletedAnalysis') + 1));

  assert.ok(createEffect.indexOf('await saveResumableScriptGenerationJob(userId, { request })') < createEffect.indexOf('createScriptGenerationJob({'));
  assert.match(createEffect, /await saveResumableScriptGenerationJob\(userId, \{ jobId: created\.id, request \}\)/);
});

test('does not resume an old script over a distinct incoming reference', async () => {
  const screen = await source();

  assert.match(screen, /const resumeMatchesIncomingReference = !params\.analysisJobId \|\| resumable\?\.request\.analysisJobId === params\.analysisJobId/);
  assert.match(screen, /const resumeMatchesIncomingSession = !params\.scriptSessionId \|\| resumable\?\.request\.clientSessionId === params\.scriptSessionId/);
  assert.match(screen, /if \(resumable && resumeMatchesIncomingReference && resumeMatchesIncomingSession\)/);
});
