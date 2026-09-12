export type GeneratedStory = {
  schemaVersion: 1;
  title: string;
  hook: string;
  story: string;
  scenes: {
    startSeconds: number;
    endSeconds: number;
    purpose: string;
    narration: string;
    visual: string;
    emotion: string;
  }[];
  ending: string;
  originalityNote: string;
};

export type ScriptGenerationJob = {
  id: string;
  analysisJobId: string;
  status: 'QUEUED' | 'GENERATING' | 'COMPLETE' | 'FAILED';
  progress: number;
  stage: string;
  attemptCount: number;
  story?: GeneratedStory;
  errorCode?: string;
  createdAt: string;
  updatedAt: string;
};

export const MAX_SCRIPT_PROMPT_LENGTH = 2_000;
export const MAX_SCRIPT_QUESTION_LENGTH = 300;
export const MAX_SCRIPT_ANSWER_LENGTH = 1_000;
export const MAX_SCRIPT_QUESTION_ANSWERS = 12;

export class ScriptGenerationClientError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ScriptGenerationClientError';
    this.status = status;
    this.code = code;
  }
}

type ClientContext = { apiUrl: string; clerkToken: string; fetch?: typeof fetch };
type CreateScriptGenerationJobInput = ClientContext & {
  idempotencyKey: string;
  analysisJobId: string;
  prompt: string;
  questionAnswers: { question: string; answer: string }[];
};
type JobInput = ClientContext & { jobId: string };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown, maximum: number): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;

export function validateScriptGenerationBrief(input: Pick<CreateScriptGenerationJobInput, 'prompt' | 'questionAnswers'>): string | null {
  if (!isText(input.prompt, MAX_SCRIPT_PROMPT_LENGTH)) {
    return `Your request must be between 1 and ${MAX_SCRIPT_PROMPT_LENGTH} characters.`;
  }
  if (!Array.isArray(input.questionAnswers) || input.questionAnswers.length > MAX_SCRIPT_QUESTION_ANSWERS) {
    return `You can include at most ${MAX_SCRIPT_QUESTION_ANSWERS} answers.`;
  }
  if (!input.questionAnswers.every((item) => isRecord(item) && isText(item.question, MAX_SCRIPT_QUESTION_LENGTH) && isText(item.answer, MAX_SCRIPT_ANSWER_LENGTH))) {
    return `Each answer must be no more than ${MAX_SCRIPT_ANSWER_LENGTH} characters.`;
  }
  return null;
}

function parseGeneratedStory(value: unknown): GeneratedStory {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isText(value.title, 200) || !isText(value.hook, 500) ||
      !isText(value.story, 8_000) || !isText(value.ending, 1_000) || !isText(value.originalityNote, 1_000) ||
      !Array.isArray(value.scenes) || value.scenes.length < 2 || value.scenes.length > 20) {
    throw new Error('Script generation response is invalid.');
  }
  let previousEnd = 0;
  const scenes = value.scenes.map((scene) => {
    if (!isRecord(scene) || typeof scene.startSeconds !== 'number' || typeof scene.endSeconds !== 'number' ||
        !Number.isFinite(scene.startSeconds) || !Number.isFinite(scene.endSeconds) || scene.startSeconds !== previousEnd ||
        scene.endSeconds <= scene.startSeconds || !isText(scene.purpose, 200) || !isText(scene.narration, 1_500) ||
        !isText(scene.visual, 1_500) || !isText(scene.emotion, 100)) throw new Error('Script generation response is invalid.');
    previousEnd = scene.endSeconds;
    return scene as GeneratedStory['scenes'][number];
  });
  return { schemaVersion: 1, title: value.title, hook: value.hook, story: value.story, scenes, ending: value.ending, originalityNote: value.originalityNote };
}

function parseScriptGenerationJob(value: unknown): ScriptGenerationJob {
  if (!isRecord(value) || !isText(value.id, 100) || !isText(value.analysisJobId, 100) ||
      !['QUEUED', 'GENERATING', 'COMPLETE', 'FAILED'].includes(String(value.status)) ||
      typeof value.progress !== 'number' || !Number.isInteger(value.progress) || value.progress < 0 || value.progress > 100 ||
      !isText(value.stage, 255) || typeof value.attemptCount !== 'number' || !Number.isInteger(value.attemptCount) ||
      value.attemptCount < 0 || value.attemptCount > 3 || !isText(value.createdAt, 100) || !isText(value.updatedAt, 100) ||
      Number.isNaN(Date.parse(value.createdAt)) || Number.isNaN(Date.parse(value.updatedAt))) {
    throw new Error('Script generation response is invalid.');
  }
  const status = value.status as ScriptGenerationJob['status'];
  if (status === 'COMPLETE' && value.story === undefined) throw new Error('Script generation response is invalid.');
  if (value.story !== undefined && status !== 'COMPLETE') throw new Error('Script generation response is invalid.');
  if (value.errorCode !== undefined && !isText(value.errorCode, 100)) throw new Error('Script generation response is invalid.');
  return {
    id: value.id,
    analysisJobId: value.analysisJobId,
    status,
    progress: value.progress,
    stage: value.stage,
    attemptCount: value.attemptCount,
    ...(value.story !== undefined ? { story: parseGeneratedStory(value.story) } : {}),
    ...(typeof value.errorCode === 'string' ? { errorCode: value.errorCode } : {}),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

async function parseResponse(response: Response, missingBackendMessage = false) {
  let body: { data?: unknown; error?: { message?: unknown; code?: unknown } } = {};
  try {
    const value: unknown = await response.json();
    if (isRecord(value)) body = value;
  } catch {
    // Use a stable product-facing fallback for non-JSON gateway responses.
  }
  if (!response.ok || body.data === undefined) {
    if (missingBackendMessage && response.status === 404 && typeof body.error?.message !== 'string') {
      throw new ScriptGenerationClientError('Script generation is not available on this server version. Deploy the latest backend, then retry.', response.status);
    }
    throw new ScriptGenerationClientError(
      typeof body.error?.message === 'string' ? body.error.message : 'Script generation failed.',
      response.status,
      typeof body.error?.code === 'string' ? body.error.code : undefined,
    );
  }
  return parseScriptGenerationJob(body.data);
}

function configured(input: ClientContext) {
  if (!input.apiUrl || !input.clerkToken) throw new Error('Script generation is not configured.');
  return input.apiUrl.replace(/\/$/, '');
}

export async function createScriptGenerationJob(input: CreateScriptGenerationJobInput): Promise<ScriptGenerationJob> {
  const validationError = validateScriptGenerationBrief(input);
  if (validationError) throw new Error(validationError);
  const apiUrl = configured(input);
  const response = await (input.fetch ?? fetch)(`${apiUrl}/api/v1/script-generation-jobs`, {
    method: 'POST',
    headers: { authorization: `Bearer ${input.clerkToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      idempotencyKey: input.idempotencyKey,
      analysisJobId: input.analysisJobId,
      brief: { prompt: input.prompt, questionAnswers: input.questionAnswers },
    }),
  });
  return parseResponse(response, true);
}

export async function getScriptGenerationJob(input: JobInput): Promise<ScriptGenerationJob> {
  const apiUrl = configured(input);
  const response = await (input.fetch ?? fetch)(`${apiUrl}/api/v1/script-generation-jobs/${encodeURIComponent(input.jobId)}`, {
    headers: { authorization: `Bearer ${input.clerkToken}` },
  });
  return parseResponse(response);
}

export async function retryScriptGenerationJob(input: JobInput): Promise<ScriptGenerationJob> {
  const apiUrl = configured(input);
  const response = await (input.fetch ?? fetch)(`${apiUrl}/api/v1/script-generation-jobs/${encodeURIComponent(input.jobId)}/retry`, {
    method: 'POST',
    headers: { authorization: `Bearer ${input.clerkToken}` },
  });
  return parseResponse(response);
}
