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

export class GeminiVideoAnalyzer implements VideoAnalyzer {
  constructor(private readonly config: GeminiConfig, private readonly fetcher: typeof fetch = fetch) {}

  async analyze(reference: ParsedVideoReference): Promise<VideoAnalysis> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetcher('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': this.config.apiKey },
        body: JSON.stringify({
          model: this.config.model,
          input: [
            { type: 'video', uri: reference.canonicalUrl },
            { type: 'text', text: ANALYSIS_PROMPT },
          ],
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new VideoAnalysisError('VIDEO_ANALYZER_UNAVAILABLE', 'The video analyzer is temporarily unavailable.');
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
