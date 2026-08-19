import type { SocialPlatformId } from '@/features/social-accounts/social-accounts';

export type PublishStatus = 'published' | 'partial';
export type PublishingPost = {
  id: string;
  title: string;
  publishedAt: string;
  duration: string;
  platforms: SocialPlatformId[];
  status: PublishStatus;
  views: number;
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
  { id: 'five-second-rule', title: 'The 5-Second Rule', publishedAt: 'Today · 9:00 AM', duration: '0:32', platforms: ['instagram', 'tiktok', 'youtube'], status: 'published', views: 84200, likes: 6800, shares: 1200, topPerformer: true, thumbnail: 'summit' },
  { id: 'discipline-habits', title: '3 Habits That Build Discipline', publishedAt: 'Yesterday · 12:30 PM', duration: '0:41', platforms: ['instagram', 'youtube'], status: 'published', views: 42800, likes: 3100, shares: 486, thumbnail: 'discipline' },
  { id: 'stop-waiting', title: 'Stop Waiting for Motivation', publishedAt: 'Mon, 17 Aug · 6:00 PM', duration: '0:38', platforms: ['tiktok', 'youtube'], status: 'published', views: 31500, likes: 2700, shares: 391, thumbnail: 'runner' },
  { id: 'consistency-system', title: 'The Consistency System', publishedAt: '8 Aug · 10:00 AM', duration: '0:45', platforms: ['instagram'], status: 'partial', views: 18900, likes: 1400, shares: 208, thumbnail: 'discipline' },
];

const WEDNESDAY_POSTS: ScheduledPost[] = [
  { id: 'five-second-scheduled', title: 'The 5-Second Rule', time: '9:00 AM', duration: '0:32', platforms: ['instagram', 'tiktok', 'youtube'], status: 'ready', thumbnail: 'summit' },
  { id: 'discipline-scheduled', title: 'Why Discipline Beats Motivation', time: '12:30 PM', duration: '0:41', platforms: ['instagram', 'youtube'], status: 'needs-approval', thumbnail: 'discipline', reviewMessage: 'Review caption before publishing' },
];

export const PUBLISHING_WEEK: PublishingDay[] = [
  { id: 'week-monday', weekday: 'MON', date: 18, hasPosts: false, posts: [] },
  { id: 'week-tuesday', weekday: 'TUE', date: 19, hasPosts: true, posts: [{ ...WEDNESDAY_POSTS[0], id: 'tuesday-preview', title: 'The Morning Momentum Rule', time: '8:45 AM' }] },
  { id: 'week-wednesday', weekday: 'WED', date: 19, hasPosts: true, isToday: true, posts: WEDNESDAY_POSTS },
  { id: 'week-thursday', weekday: 'THU', date: 20, hasPosts: true, posts: [{ ...WEDNESDAY_POSTS[0], id: 'thursday-preview', title: 'Build Focus That Lasts', time: '9:15 AM' }] },
  { id: 'week-friday', weekday: 'FRI', date: 21, hasPosts: false, posts: [] },
  { id: 'week-saturday', weekday: 'SAT', date: 22, hasPosts: true, posts: [{ ...WEDNESDAY_POSTS[1], id: 'saturday-preview', title: 'Consistency Beats Intensity', time: '11:00 AM' }] },
  { id: 'week-sunday', weekday: 'SUN', date: 23, hasPosts: false, posts: [] },
];

export const SCHEDULED_POSTS = PUBLISHING_WEEK.flatMap((day) => day.posts);

export function filterPublishedPosts(posts: PublishingPost[], range: TimeRange, platform: PlatformFilter) {
  const rangeLimit = range === '7-days' ? 3 : range === '30-days' ? 4 : posts.length;
  return posts.slice(0, rangeLimit).filter((post) => platform === 'all' || post.platforms.includes(platform));
}

export function formatMetric(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1).replace('.0', '')}K` : String(value);
}
