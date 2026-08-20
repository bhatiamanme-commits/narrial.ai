import type { SocialPlatformId } from '@/features/social-accounts/social-accounts';
import type { ScheduledPost as PersistedScheduledPost } from '@/features/scheduling/scheduling-service';

export type PublishStatus = 'published' | 'partial';
export type PublishingPost = {
  id: string;
  title: string;
  publishedAt: string;
  publishedAtLabel: string;
  duration: string;
  platforms: SocialPlatformId[];
  status: PublishStatus;
  views: number;
  engagements: number;
  likes: number;
  shares: number;
  topPerformer?: boolean;
  thumbnail: 'summit' | 'discipline' | 'runner';
};

export type TimeRange = '7-days' | '30-days' | 'all-time';
export type PlatformFilter = 'all' | SocialPlatformId;

export type ScheduledStatus = 'ready' | 'needs-approval';
export type ScheduledPost = {
  id: string;
  title: string;
  time: string;
  duration: string;
  platforms: SocialPlatformId[];
  status: ScheduledStatus;
  thumbnail: PublishingPost['thumbnail'];
  reviewMessage?: string;
};

export type PublishingDay = {
  id: string;
  weekday: string;
  date: number;
  hasPosts: boolean;
  isToday?: boolean;
  posts: ScheduledPost[];
};

export const PUBLISHED_POSTS: PublishingPost[] = [
  { id: 'five-second-rule', title: 'The 5-Second Rule', publishedAt: '2026-08-19T03:30:00.000Z', publishedAtLabel: 'Today · 9:00 AM', duration: '0:32', platforms: ['instagram', 'tiktok', 'youtube'], status: 'published', views: 84200, engagements: 8000, likes: 6800, shares: 1200, topPerformer: true, thumbnail: 'summit' },
  { id: 'discipline-habits', title: '3 Habits That Build Discipline', publishedAt: '2026-08-18T07:00:00.000Z', publishedAtLabel: 'Yesterday · 12:30 PM', duration: '0:41', platforms: ['instagram', 'youtube'], status: 'published', views: 42800, engagements: 3586, likes: 3100, shares: 486, thumbnail: 'discipline' },
  { id: 'stop-waiting', title: 'Stop Waiting for Motivation', publishedAt: '2026-08-17T12:30:00.000Z', publishedAtLabel: 'Mon, 17 Aug · 6:00 PM', duration: '0:38', platforms: ['tiktok', 'youtube'], status: 'published', views: 31500, engagements: 3091, likes: 2700, shares: 391, thumbnail: 'runner' },
  { id: 'consistency-system', title: 'The Consistency System', publishedAt: '2026-08-08T04:30:00.000Z', publishedAtLabel: '8 Aug · 10:00 AM', duration: '0:45', platforms: ['instagram'], status: 'partial', views: 18900, engagements: 1608, likes: 1400, shares: 208, thumbnail: 'discipline' },
];

const WEDNESDAY_POSTS: ScheduledPost[] = [
  { id: 'five-second-scheduled', title: 'The 5-Second Rule', time: '9:00 AM', duration: '0:32', platforms: ['instagram', 'tiktok', 'youtube'], status: 'ready', thumbnail: 'summit' },
  { id: 'discipline-scheduled', title: 'Why Discipline Beats Motivation', time: '12:30 PM', duration: '0:41', platforms: ['instagram', 'youtube'], status: 'needs-approval', thumbnail: 'discipline', reviewMessage: 'Review caption before publishing' },
];

export const PUBLISHING_WEEK: PublishingDay[] = [
  { id: 'week-monday', weekday: 'MON', date: 18, hasPosts: false, posts: [] },
  { id: 'week-tuesday', weekday: 'TUE', date: 19, hasPosts: true, posts: [{ ...WEDNESDAY_POSTS[0], id: 'tuesday-preview', title: 'The Morning Momentum Rule', time: '8:45 AM' }] },
  { id: 'week-wednesday', weekday: 'WED', date: 20, hasPosts: true, isToday: true, posts: WEDNESDAY_POSTS },
  { id: 'week-thursday', weekday: 'THU', date: 21, hasPosts: true, posts: [{ ...WEDNESDAY_POSTS[0], id: 'thursday-preview', title: 'Build Focus That Lasts', time: '9:15 AM' }] },
  { id: 'week-friday', weekday: 'FRI', date: 22, hasPosts: false, posts: [] },
  { id: 'week-saturday', weekday: 'SAT', date: 23, hasPosts: true, posts: [{ ...WEDNESDAY_POSTS[1], id: 'saturday-preview', title: 'Consistency Beats Intensity', time: '11:00 AM' }] },
  { id: 'week-sunday', weekday: 'SUN', date: 24, hasPosts: false, posts: [] },
];

export const SCHEDULED_POSTS = PUBLISHING_WEEK.flatMap((day) => day.posts);

export function applyScheduledOperations(week: PublishingDay[], operations: PersistedScheduledPost[]): PublishingDay[] {
  const next = week.map((day) => ({ ...day, posts: day.posts.map((post) => ({ ...post, platforms: [...post.platforms] })) }));

  for (const operation of operations) {
    const scheduledAt = new Date(operation.scheduledAt);
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: operation.timezone }).format(scheduledAt).toUpperCase();
    const date = Number(new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: operation.timezone }).format(scheduledAt));
    const destination = next.find((day) => day.weekday === weekday && day.date === date);
    if (!destination) continue;
    if (operation.action === 'create') {
      if (!operation.content) continue;
      destination.posts.push({
        id: operation.postId,
        ...operation.content,
        platforms: [...operation.content.platforms],
        time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: operation.timezone }).format(scheduledAt),
      });
      continue;
    }

    const source = next.flatMap((day) => day.posts).find((post) => post.id === operation.postId)
      ?? week.flatMap((day) => day.posts).find((post) => post.id === operation.postId);
    if (!source) continue;
    if (operation.action === 'reschedule') {
      for (const day of next) day.posts = day.posts.filter((post) => post.id !== operation.postId);
    }
    destination.posts.push({
      ...source,
      id: operation.action === 'duplicate' ? operation.id : source.id,
      time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: operation.timezone }).format(scheduledAt),
    });
  }

  return next.map((day) => ({ ...day, hasPosts: day.posts.length > 0 }));
}

export function filterPublishedPosts(posts: PublishingPost[], range: TimeRange, platform: PlatformFilter, now = new Date()) {
  const rangeDays = range === '7-days' ? 7 : range === '30-days' ? 30 : null;
  const cutoff = rangeDays === null ? null : now.getTime() - rangeDays * 24 * 60 * 60 * 1000;
  return posts.filter((post) => (cutoff === null || Date.parse(post.publishedAt) >= cutoff) && (platform === 'all' || post.platforms.includes(platform)));
}

export function getContentPerformance(posts: Pick<PublishingPost, 'views' | 'engagements'>[]) {
  const totals = posts.reduce((result, post) => ({ views: result.views + post.views, engagements: result.engagements + post.engagements }), { views: 0, engagements: 0 });
  return { views: totals.views, engagement: totals.views ? Math.round((totals.engagements / totals.views) * 1000) / 10 : 0 };
}

export function formatMetric(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1).replace('.0', '')}K` : String(value);
}
