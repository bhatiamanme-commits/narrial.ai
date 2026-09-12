import * as SecureStore from 'expo-secure-store';

export type ResumableScriptGenerationRequest = {
  analysisJobId: string;
  idempotencyKey: string;
  prompt: string;
  questionAnswers: { question: string; answer: string }[];
  clientSessionId?: string;
};

export type ResumableScriptGenerationJob = {
  jobId?: string;
  request: ResumableScriptGenerationRequest;
  savedAt: string;
};

const storageOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

function storageKey(userId: string) {
  return `narrial:script-generation:last-job:${userId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && Boolean(value.trim()) && value.length <= maximum;
}

function parseRequest(value: unknown): ResumableScriptGenerationRequest | null {
  if (!isRecord(value) || !isText(value.analysisJobId, 100) || !isText(value.idempotencyKey, 100) ||
      !isText(value.prompt, 2_000) || !Array.isArray(value.questionAnswers) || value.questionAnswers.length > 12) return null;
  const questionAnswers = value.questionAnswers.map((answer) => {
    if (!isRecord(answer) || !isText(answer.question, 300) || !isText(answer.answer, 1_000)) return null;
    return { question: answer.question, answer: answer.answer };
  });
  if (questionAnswers.some((answer) => answer === null)) return null;
  if (value.clientSessionId !== undefined && !isText(value.clientSessionId, 100)) return null;
  return {
    analysisJobId: value.analysisJobId,
    idempotencyKey: value.idempotencyKey,
    prompt: value.prompt,
    questionAnswers: questionAnswers as { question: string; answer: string }[],
    ...(typeof value.clientSessionId === 'string' ? { clientSessionId: value.clientSessionId } : {}),
  };
}

function parseStoredJob(value: string | null): ResumableScriptGenerationJob | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || typeof parsed.savedAt !== 'string' || Number.isNaN(Date.parse(parsed.savedAt)) ||
        (parsed.jobId !== undefined && !isText(parsed.jobId, 100))) return null;
    const request = parseRequest(parsed.request);
    if (!request) return null;
    return {
      ...(typeof parsed.jobId === 'string' ? { jobId: parsed.jobId } : {}),
      request,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

export async function loadResumableScriptGenerationJob(userId: string): Promise<ResumableScriptGenerationJob | null> {
  try {
    return parseStoredJob(await SecureStore.getItemAsync(storageKey(userId), storageOptions));
  } catch {
    // Local resume is an enhancement. A platform storage failure must not block generation.
    return null;
  }
}

export async function saveResumableScriptGenerationJob(userId: string, job: Omit<ResumableScriptGenerationJob, 'savedAt'>): Promise<void> {
  try {
    await SecureStore.setItemAsync(storageKey(userId), JSON.stringify({ ...job, savedAt: new Date().toISOString() }), storageOptions);
  } catch {
    // The server remains the source of truth; this is intentionally best effort.
  }
}

export async function clearResumableScriptGenerationJob(userId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(storageKey(userId), storageOptions);
  } catch {
    // Ignore unavailable local storage.
  }
}
