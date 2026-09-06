import type { VideoAnalysis } from '@/features/video-analysis/video-analysis-client';
import type { BriefAnswer, CreativeBrief, VideoProject } from '@/features/video-creation/video-project';

export type ViralDNASessionSeed = {
  id: string;
  referenceId: string;
  referenceName: string;
  referenceSource?: string;
  referenceThumbnailSource?: string;
  platform: string;
  aspectRatio: string;
  topic?: string;
  analysis: VideoAnalysis;
  answers?: BriefAnswer;
  brief?: CreativeBrief;
  phase?: 'dna' | 'questions' | 'brief';
  savedAt: string;
};

type StorageAdapter = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> };

const PREFIX = 'narrial.viral-dna.';

function browserStorage(): StorageAdapter | null {
  if (typeof globalThis.localStorage === 'undefined') return null;
  return {
    getItem: async (key) => globalThis.localStorage.getItem(key),
    setItem: async (key, value) => globalThis.localStorage.setItem(key, value),
    removeItem: async (key) => globalThis.localStorage.removeItem(key),
  };
}

function defaultStorage(): StorageAdapter {
  return browserStorage() ?? {
    getItem: async (key) => (await import('expo-secure-store')).getItemAsync(key),
    setItem: async (key, value) => (await import('expo-secure-store')).setItemAsync(key, value),
    removeItem: async (key) => (await import('expo-secure-store')).deleteItemAsync(key),
  };
}

async function write(key: string, value: unknown, adapter = defaultStorage()) {
  await adapter.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

async function read<T>(key: string, adapter = defaultStorage()): Promise<T | null> {
  const value = await adapter.getItem(`${PREFIX}${key}`);
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

export async function saveViralDNASession(seed: ViralDNASessionSeed, adapter?: StorageAdapter) { await write(`seed.${seed.id}`, seed, adapter); }
export async function loadViralDNASession(id: string, adapter?: StorageAdapter) { return read<ViralDNASessionSeed>(`seed.${id}`, adapter); }
export async function saveVideoProject(project: VideoProject, adapter?: StorageAdapter) { await write(`project.${project.id}`, project, adapter); }
export async function loadVideoProject(id: string, adapter?: StorageAdapter) { return read<VideoProject>(`project.${id}`, adapter); }
export async function removeVideoProject(id: string, adapter?: StorageAdapter) { await (adapter ?? defaultStorage()).removeItem(`${PREFIX}project.${id}`); }

export function createMemoryStorage(initial: Record<string, string> = {}): StorageAdapter {
  const values = new Map(Object.entries(initial));
  return { getItem: async (key) => values.get(key) ?? null, setItem: async (key, value) => { values.set(key, value); }, removeItem: async (key) => { values.delete(key); } };
}
