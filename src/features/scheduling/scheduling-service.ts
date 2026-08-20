export type SchedulingAction = 'create' | 'reschedule' | 'duplicate';
export type ScheduleRequest = { userId: string; accountIds: string[]; postId: string; scheduledAt: string; timezone: string; action?: SchedulingAction };
export type ScheduledPost = ScheduleRequest & { id: string; status: 'scheduled' };
export type SchedulingDraft = { userId: string; postId: string; action: SchedulingAction };

export class SchedulingConflictError extends Error {}

const scheduledOperations = new Map<string, ScheduledPost>();
let activeDraft: SchedulingDraft | null = null;

export function startSchedulingDraft(userId: string, postId: string, action: SchedulingAction = 'create'): void {
  activeDraft = { userId, postId, action };
}

export function getSchedulingDraft(userId: string): SchedulingDraft | null {
  return activeDraft?.userId === userId ? { ...activeDraft } : null;
}

export function clearSchedulingDraft(): void {
  activeDraft = null;
}

export function getScheduledPosts(userId: string): ScheduledPost[] {
  return [...scheduledOperations.values()].filter((post) => post.userId === userId).map((post) => ({ ...post, accountIds: [...post.accountIds] }));
}

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

function isSupportedTimezone(timezone: string): boolean {
  if (!timezone.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

// Replace this boundary with the publishing API; the screen owns no transport details.
export async function schedulePost(request: ScheduleRequest): Promise<ScheduledPost> {
  if (typeof request.postId !== 'string' || !request.postId.trim()) throw new Error('Choose a post to schedule.');
  if (typeof request.scheduledAt !== 'string') throw new Error('Choose a valid schedule time.');
  const scheduledTime = Date.parse(request.scheduledAt);
  if (!Number.isFinite(scheduledTime)) throw new Error('Choose a valid schedule time.');
  if (scheduledTime <= Date.now()) throw new Error('Choose a time in the future.');
  if (typeof request.timezone !== 'string' || !isSupportedTimezone(request.timezone)) throw new Error('Choose a supported time zone.');
  await wait(700);
  if (!request.userId || !request.accountIds.length) throw new Error('Your publishing selection is incomplete. Go back and choose an account.');
  const key = `${request.userId}:${request.postId}:${request.scheduledAt}`;
  if (scheduledOperations.has(key)) throw new SchedulingConflictError('This post is already scheduled for that time. Choose another time.');
  const result: ScheduledPost = { ...request, action: request.action ?? 'create', id: `schedule-${Date.now()}`, status: 'scheduled' };
  scheduledOperations.set(key, result);
  return result;
}
