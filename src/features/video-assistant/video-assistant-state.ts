export type VideoAssistantPhase = 'questions' | 'analyzing' | 'complete';
export type AnalysisStepState = 'complete' | 'active' | 'upcoming';
export type QuestionDefinition = { id: string; title: string; defaultOption?: string };
export type CollectedAnswer = { option?: string; custom?: string; skipped?: boolean };
export type QuestionAnswer = { question: string; answer: string };

export const ANALYSIS_STEPS = [
  { id: 'dna', label: 'Understanding your video DNA', activity: 'Mapping pacing, tone, and structure' },
  { id: 'visuals', label: 'Understanding the visuals', activity: 'Reading composition, motion, and text' },
  { id: 'scenes-audio', label: 'Understanding scenes and audio', activity: 'Listening for dialogue, music, and rhythm' },
  { id: 'hook', label: 'Finding the hook', activity: 'Detecting the opening attention trigger' },
  { id: 'patterns', label: 'Learning content patterns', activity: 'Connecting recurring creative decisions' },
  { id: 'performance', label: 'Reading performance signals', activity: 'Evaluating retention and engagement cues' },
] as const;

const MAX_IN_PROGRESS_DISPLAY = 92;

export function getNextAnalysisDisplayProgress(displayProgress: number, reportedProgress: number): number {
  const boundedDisplay = Math.max(0, Math.min(100, Math.round(displayProgress)));
  const boundedReported = Math.max(0, Math.min(100, Math.round(reportedProgress)));
  if (boundedReported >= 100) return 100;
  return Math.min(MAX_IN_PROGRESS_DISPLAY, Math.max(boundedReported, boundedDisplay + 1));
}

export function getAnalysisStepStates(activeStep: number): AnalysisStepState[] {
  const boundedActiveStep = Math.max(0, Math.min(ANALYSIS_STEPS.length - 1, activeStep));
  return ANALYSIS_STEPS.map((_, index) => index < boundedActiveStep ? 'complete' : index === boundedActiveStep ? 'active' : 'upcoming');
}

export function getAnalysisStepIndex(analysisPercentage: number): number {
  const boundedPercentage = Math.max(0, Math.min(100, analysisPercentage));
  return Math.min(ANALYSIS_STEPS.length - 1, Math.floor(boundedPercentage / (100 / ANALYSIS_STEPS.length)));
}

export function getAnalysisPresentation(analysisPercentage: number): 'process' | 'summary' {
  return analysisPercentage >= 100 ? 'summary' : 'process';
}

export function buildQuestionAnswerPayload(questions: readonly QuestionDefinition[], answers: Record<string, CollectedAnswer>): QuestionAnswer[] {
  return questions.map((question) => {
    const answer = answers[question.id];
    return {
      question: question.title,
      answer: answer?.skipped ? 'Not specified' : answer?.custom?.trim() || answer?.option || 'Not specified',
    };
  });
}

export function recordQuestionAdvance(
  answers: Record<string, CollectedAnswer>,
  question: QuestionDefinition,
  action: 'next' | 'skip',
): Record<string, CollectedAnswer> {
  if (action === 'skip') return { ...answers, [question.id]: { skipped: true } };
  const selectedAnswer = answers[question.id] ?? (question.defaultOption ? { option: question.defaultOption } : undefined);
  return selectedAnswer ? { ...answers, [question.id]: selectedAnswer } : answers;
}

export function buildCompleteQuestionAnswerPayload(
  questions: readonly QuestionDefinition[],
  answers: Record<string, CollectedAnswer>,
  additionalDirections: readonly string[],
): QuestionAnswer[] {
  const payload = buildQuestionAnswerPayload(questions, answers);
  const additionalAnswer = additionalDirections.map((item) => item.trim()).filter(Boolean).join('\n');
  return additionalAnswer
    ? [...payload, { question: 'Additional creative direction', answer: additionalAnswer }]
    : payload;
}

export function getVideoAssistantPhase(questionsComplete: boolean, analysisPercentage: number): VideoAssistantPhase {
  if (!questionsComplete) return 'questions';
  return analysisPercentage >= 100 ? 'complete' : 'analyzing';
}
