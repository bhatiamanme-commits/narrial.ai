export type VideoAssistantPhase = 'questions' | 'analyzing' | 'complete';
export type AnalysisStepState = 'complete' | 'active' | 'upcoming';
type QuestionDefinition = { id: string; title: string };
type CollectedAnswer = { option?: string; custom?: string; skipped?: boolean };
export type QuestionAnswer = { question: string; answer: string };

export const ANALYSIS_STEPS = [
  { id: 'dna', label: 'Understanding your video DNA', activity: 'Mapping pacing · tone · structure' },
  { id: 'hook', label: 'Finding the hook', activity: 'Detecting the opening attention trigger' },
  { id: 'visuals', label: 'Creating the visuals', activity: 'Matching composition · motion · typography' },
  { id: 'patterns', label: 'Learning content patterns', activity: 'Connecting recurring creative decisions' },
  { id: 'performance', label: 'Reading performance and signals', activity: 'Evaluating retention · rhythm · engagement' },
] as const;

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

export function getVideoAssistantPhase(questionsComplete: boolean, analysisPercentage: number): VideoAssistantPhase {
  if (!questionsComplete) return 'questions';
  return analysisPercentage >= 100 ? 'complete' : 'analyzing';
}
