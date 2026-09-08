export type ClarificationQuestion = { id: 'topic' | 'audience' | 'emotion' | 'action'; title: string; support: string; options: string[]; customOption?: string; defaultOption?: string };
export type ClarificationAnswer = { option?: string; custom?: string; skipped?: boolean };

export function buildClarificationQuestions({ prompt }: { prompt?: string }): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];
  if (!prompt?.trim()) questions.push({ id: 'topic', title: 'What should the new video be about?', support: 'This anchors the original script without copying the reference.', options: ['Explain my product', 'Promote a feature', 'Teach something', 'Custom topic'], customOption: 'Custom topic' });
  questions.push(
    { id: 'audience', title: 'Who should feel this was made for them?', support: 'Audience changes the language, examples, and pace.', options: ['Creators', 'Small businesses', 'Consumers', 'Custom audience'], customOption: 'Custom audience' },
    { id: 'emotion', title: 'Which emotion should lead the video?', support: 'This guides the voice, visuals, music, and editing intensity.', options: ['Curiosity', 'Excitement', 'Trust', 'Inspiration', 'Humour', 'Let Narial decide'], defaultOption: 'Let Narial decide' },
    { id: 'action', title: 'What should viewers do after watching?', support: 'One clear outcome keeps the ending focused.', options: ['Try the product', 'Visit a website', 'Follow the account', 'Comment', 'Save or share', 'No direct CTA'], defaultOption: 'No direct CTA' },
  );
  return questions;
}

function answerValue(answer: ClarificationAnswer | undefined, fallback: string) {
  if (!answer || answer.skipped || answer.option === 'Let Narial decide') return fallback;
  return answer.custom?.trim() || answer.option || fallback;
}

export function buildCreativeBrief(input: { prompt?: string; aspectRatio?: string }, answers: Record<string, ClarificationAnswer>) {
  return {
    topic: input.prompt?.trim() || answerValue(answers.topic, 'Narial decides'),
    audience: answerValue(answers.audience, 'Narial decides'),
    primaryEmotion: answerValue(answers.emotion, 'Narial decides'),
    desiredAction: answerValue(answers.action, 'No direct CTA'),
    aspectRatio: input.aspectRatio || '9:16',
  };
}

export function buildAiCreativeContext(input: {
  prompt?: string;
  referenceSummary?: string;
  questions: readonly ClarificationQuestion[];
  answers: Record<string, ClarificationAnswer>;
}) {
  return {
    schemaVersion: 1 as const,
    instruction: 'Create an original video using the reference only for structural and retention principles.',
    userIntent: {
      originalPrompt: input.prompt?.trim() || 'Not provided',
      questionAnswers: input.questions.map((question) => ({
        questionId: question.id,
        question: question.title,
        answer: answerValue(input.answers[question.id], 'Not specified'),
      })),
    },
    referenceContext: { summary: input.referenceSummary?.trim() || 'Not available' },
    constraints: { copyReferenceDialogue: false, copyCreatorIdentity: false, copyDistinctiveAssets: false },
  };
}
