import { parseVideoAnalysis, VideoAnalysisError, type VideoAnalysis, type ParsedVideoReference } from './domain.js';
import type { VideoAnalyzer } from './ports.js';

interface GeminiConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

const ANALYSIS_PROMPT = `Analyze both the visual and audio content of this video. Return only one JSON object, without markdown.
Use this exact shape:
{"summary":"string","durationSeconds":number,"language":"optional string","subjects":[{"label":"string","description":"string"}],"scenes":[{"startSeconds":number,"endSeconds":number,"description":"string","shotType":"optional string","cameraMovement":"optional string","transition":"optional string","onScreenText":["optional string"],"spokenContent":"optional string"}],"creativeDNA":{"openingHook":"string","narrativeStructure":"string","pacing":"string","visualStyle":["string"],"colorMood":["string"],"editingPatterns":["string"],"audioStyle":"string","callToAction":"optional string"},"reusableInsights":["string"],"safetyFlags":["string"]}.
Use seconds for timestamps. Separate observed facts from creative interpretation. Describe reusable patterns without asking to copy protected characters, brands, music, or exact creative expression.`;

const ANALYSIS_RESPONSE_FORMAT = {
  type: 'text',
  mime_type: 'application/json',
  schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      durationSeconds: { type: 'number' },
      language: { type: 'string' },
      subjects: {
        type: 'array',
        items: {
          type: 'object',
          properties: { label: { type: 'string' }, description: { type: 'string' } },
          required: ['label', 'description'],
        },
      },
      scenes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            startSeconds: { type: 'number' },
            endSeconds: { type: 'number' },
            description: { type: 'string' },
            shotType: { type: 'string' },
            cameraMovement: { type: 'string' },
            transition: { type: 'string' },
            onScreenText: { type: 'array', items: { type: 'string' } },
            spokenContent: { type: 'string' },
          },
          required: ['startSeconds', 'endSeconds', 'description'],
        },
      },
      creativeDNA: {
        type: 'object',
        properties: {
          openingHook: { type: 'string' },
          narrativeStructure: { type: 'string' },
          pacing: { type: 'string' },
          visualStyle: { type: 'array', items: { type: 'string' } },
          colorMood: { type: 'array', items: { type: 'string' } },
          editingPatterns: { type: 'array', items: { type: 'string' } },
          audioStyle: { type: 'string' },
          callToAction: { type: 'string' },
        },
        required: ['openingHook', 'narrativeStructure', 'pacing', 'visualStyle', 'colorMood', 'editingPatterns', 'audioStyle'],
      },
      reusableInsights: { type: 'array', items: { type: 'string' } },
      safetyFlags: { type: 'array', items: { type: 'string' } },
    },
    required: ['summary', 'durationSeconds', 'subjects', 'scenes', 'creativeDNA', 'reusableInsights', 'safetyFlags'],
  },
} as const;

function extractText(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.output_text === 'string') return record.output_text;
  if (Array.isArray(record.steps)) {
    const steps: unknown[] = record.steps;
    for (const step of steps.slice().reverse()) {
      if (!step || typeof step !== 'object') continue;
      const content = (step as Record<string, unknown>).content;
      if (!Array.isArray(content)) continue;
      for (const part of content) {
        if (part && typeof part === 'object' && typeof (part as Record<string, unknown>).text === 'string') {
          return (part as Record<string, string>).text ?? null;
        }
      }
    }
  }
  return null;
}

function parseJsonText(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new VideoAnalysisError('INVALID_ANALYSIS', 'The analyzer returned an invalid analysis.');
  }
}

function providerResponseError(status: number): VideoAnalysisError {
  if (status === 400 || status === 404 || status === 422) {
    return new VideoAnalysisError('VIDEO_ANALYZER_REQUEST_REJECTED', 'The video analyzer rejected the analysis request.');
  }
  if (status === 401 || status === 403) {
    return new VideoAnalysisError('VIDEO_ANALYZER_AUTHENTICATION_FAILED', 'The video analyzer is not configured correctly.');
  }
  if (status === 429) {
    return new VideoAnalysisError('VIDEO_ANALYZER_RATE_LIMITED', 'The video analyzer is temporarily rate limited.');
  }
  return new VideoAnalysisError('VIDEO_ANALYZER_UNAVAILABLE', 'The video analyzer is temporarily unavailable.');
}

export class GeminiVideoAnalyzer implements VideoAnalyzer {
  constructor(private readonly config: GeminiConfig, private readonly fetcher: typeof fetch = fetch) {}

  async analyze(reference: ParsedVideoReference, signal?: AbortSignal): Promise<VideoAnalysis> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetcher('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': this.config.apiKey },
        body: JSON.stringify({
          model: this.config.model,
          input: [
            { type: 'text', text: ANALYSIS_PROMPT },
            { type: 'video', uri: reference.canonicalUrl },
          ],
          response_format: ANALYSIS_RESPONSE_FORMAT,
          store: false,
        }),
        signal: signal ? AbortSignal.any([controller.signal, signal]) : controller.signal,
      });
      if (!response.ok) throw providerResponseError(response.status);
      const text = extractText(await response.json() as unknown);
      if (!text) throw new VideoAnalysisError('INVALID_ANALYSIS', 'The analyzer returned an invalid analysis.');
      return parseVideoAnalysis(parseJsonText(text));
    } catch (error) {
      if (error instanceof VideoAnalysisError) throw error;
      throw new VideoAnalysisError('VIDEO_ANALYZER_UNAVAILABLE', 'The video analyzer is temporarily unavailable.');
    } finally {
      clearTimeout(timeout);
    }
  }
}
