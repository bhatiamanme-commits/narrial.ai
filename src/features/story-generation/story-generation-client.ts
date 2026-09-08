import type { VideoAnalysis } from '@/features/video-analysis/video-analysis-client';
export type GeneratedStory = { schemaVersion: 1; title: string; hook: string; story: string; scenes: { startSeconds: number; endSeconds: number; purpose: string; narration: string; visual: string; emotion: string }[]; ending: string; originalityNote: string };
export async function generateStory(input: { apiUrl: string; clerkToken: string; analysis: VideoAnalysis; prompt: string; questionAnswers: { question: string; answer: string }[] }) {
  const response = await fetch(`${input.apiUrl.replace(/\/$/, '')}/api/v1/stories/generate`, { method: 'POST', headers: { authorization: `Bearer ${input.clerkToken}`, 'content-type': 'application/json' }, body: JSON.stringify({ analysis: input.analysis, prompt: input.prompt, questionAnswers: input.questionAnswers }) });
  const body = await response.json() as { data?: GeneratedStory; error?: { message?: string } };
  if (response.status === 404) throw new Error('Story generation is not available on this server version. Deploy the latest backend, then retry.');
  if (!response.ok || !body.data) throw new Error(body.error?.message || 'Story generation failed.');
  return body.data;
}
