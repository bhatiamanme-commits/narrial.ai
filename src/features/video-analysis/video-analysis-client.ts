export type VideoAnalysis = {
  schemaVersion: 1;
  summary: string;
  durationSeconds: number;
  language?: string;
  subjects: { label: string; description: string }[];
  scenes: {
    startSeconds: number;
    endSeconds: number;
    description: string;
    shotType?: string;
    cameraMovement?: string;
    transition?: string;
    onScreenText?: string[];
    spokenContent?: string;
  }[];
  creativeDNA: {
    openingHook: string;
    narrativeStructure: string;
    pacing: string;
    visualStyle: string[];
    colorMood: string[];
    editingPatterns: string[];
    audioStyle: string;
    callToAction?: string;
  };
  reusableInsights: string[];
  safetyFlags: string[];
};

export type VideoAnalysisJob = {
  id: string;
  referenceId: string;
  status: 'QUEUED' | 'ANALYZING' | 'COMPLETE' | 'FAILED';
  progress: number;
  stage: string;
  updatedAt: string;
  errorCode?: string;
  analysis?: VideoAnalysis;
};

export type SubmittedVideoReference = {
  reference: { id: string; provider: 'YOUTUBE'; title: string; thumbnailUrl: string };
  analysisJob: VideoAnalysisJob;
};

type ApiInput = { apiUrl: string; clerkToken: string; fetch?: typeof fetch };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseAnalysis(value: unknown): VideoAnalysis {
  const dna = isRecord(value) && isRecord(value.creativeDNA) ? value.creativeDNA : null;
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.summary !== 'string' ||
      typeof value.durationSeconds !== 'number' || !Array.isArray(value.subjects) || !Array.isArray(value.scenes) ||
      !dna || typeof dna.openingHook !== 'string' || typeof dna.narrativeStructure !== 'string' ||
      typeof dna.pacing !== 'string' || typeof dna.audioStyle !== 'string' ||
      !Array.isArray(dna.visualStyle) || !Array.isArray(dna.colorMood) || !Array.isArray(dna.editingPatterns) ||
      !Array.isArray(value.reusableInsights) || !Array.isArray(value.safetyFlags)) {
    throw new Error('Video analysis response is invalid.');
  }
  return value as VideoAnalysis;
}

function parseJob(value: unknown): VideoAnalysisJob {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.referenceId !== 'string' ||
      !['QUEUED', 'ANALYZING', 'COMPLETE', 'FAILED'].includes(String(value.status)) ||
      typeof value.progress !== 'number' || value.progress < 0 || value.progress > 100 ||
      typeof value.stage !== 'string' || typeof value.updatedAt !== 'string') {
    throw new Error('Video analysis response is invalid.');
  }
  const job = value as unknown as VideoAnalysisJob;
  if (value.analysis !== undefined) job.analysis = parseAnalysis(value.analysis);
  return job;
}

async function parseApiError(response: Response): Promise<Error> {
  try {
    const body = await response.json() as { error?: { message?: unknown } };
    if (typeof body.error?.message === 'string') return new Error(body.error.message);
  } catch { /* use stable fallback */ }
  return new Error('Video analysis request failed.');
}

function requestBase(input: ApiInput) {
  if (!input.apiUrl || !input.clerkToken) throw new Error('Video analysis is not configured.');
  return { apiUrl: input.apiUrl.replace(/\/$/, ''), fetcher: input.fetch ?? fetch };
}

export async function submitVideoReference(input: ApiInput & { url: string }): Promise<SubmittedVideoReference> {
  const { apiUrl, fetcher } = requestBase(input);
  const response = await fetcher(`${apiUrl}/api/v1/video-references`, {
    method: 'POST', headers: { authorization: `Bearer ${input.clerkToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ url: input.url }),
  });
  if (!response.ok) throw await parseApiError(response);
  const value: unknown = await response.json();
  const data = isRecord(value) && isRecord(value.data) ? value.data : null;
  const reference = data && isRecord(data.reference) ? data.reference : null;
  if (!reference || typeof reference.id !== 'string' || reference.provider !== 'YOUTUBE' ||
      typeof reference.title !== 'string' || typeof reference.thumbnailUrl !== 'string') {
    throw new Error('Video analysis response is invalid.');
  }
  return { reference: reference as SubmittedVideoReference['reference'], analysisJob: parseJob(data!.analysisJob) };
}

export async function getVideoAnalysisJob(input: ApiInput & { jobId: string }): Promise<VideoAnalysisJob> {
  const { apiUrl, fetcher } = requestBase(input);
  const response = await fetcher(`${apiUrl}/api/v1/video-analysis-jobs/${encodeURIComponent(input.jobId)}`, {
    headers: { authorization: `Bearer ${input.clerkToken}`, 'content-type': 'application/json' },
  });
  if (!response.ok) throw await parseApiError(response);
  const value: unknown = await response.json();
  return parseJob(isRecord(value) ? value.data : undefined);
}

export async function retryVideoAnalysisJob(input: ApiInput & { jobId: string }): Promise<VideoAnalysisJob> {
  const { apiUrl, fetcher } = requestBase(input);
  const response = await fetcher(`${apiUrl}/api/v1/video-analysis-jobs/${encodeURIComponent(input.jobId)}/retry`, {
    method: 'POST', headers: { authorization: `Bearer ${input.clerkToken}`, 'content-type': 'application/json' },
  });
  if (!response.ok) throw await parseApiError(response);
  const value: unknown = await response.json();
  return parseJob(isRecord(value) ? value.data : undefined);
}
