export type ScheduleRequest = { userId: string; accountIds: string[]; postId: string; scheduledAt: string; timezone: string };
export type ScheduledPost = ScheduleRequest & { id: string; status: 'scheduled' };

export class SchedulingConflictError extends Error {}

const scheduledOperations = new Map<string, ScheduledPost>();
let activeDraft: { userId: string; postId: string } | null = null;

export function startSchedulingDraft(userId: string, postId: string): void {
  activeDraft = { userId, postId };
}

export function getSchedulingDraft(userId: string): { userId: string; postId: string } | null {
  return activeDraft?.userId === userId ? { ...activeDraft } : null;
}

export function clearSchedulingDraft(): void {
  activeDraft = null;
}

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

// Replace this boundary with the publishing API; the screen owns no transport details.
export async function schedulePost(request: ScheduleRequest): Promise<ScheduledPost> {
  await wait(700);
  if (!request.userId || !request.accountIds.length) throw new Error('Your publishing selection is incomplete. Go back and choose an account.');
  const key = `${request.userId}:${request.postId}:${request.scheduledAt}`;
  if (scheduledOperations.has(key)) throw new SchedulingConflictError('This post is already scheduled for that time. Choose another time.');
  const result: ScheduledPost = { ...request, id: `schedule-${Date.now()}`, status: 'scheduled' };
  scheduledOperations.set(key, result);
  return result;
}
