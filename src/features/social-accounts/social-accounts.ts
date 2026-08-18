export type SocialPlatformId = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'x' | 'linkedin';

export type SocialPlatform = {
  id: SocialPlatformId;
  name: string;
  connected: boolean;
};

export const INITIAL_SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', name: 'Instagram', connected: true },
  { id: 'tiktok', name: 'TikTok', connected: false },
  { id: 'youtube', name: 'YouTube', connected: true },
  { id: 'facebook', name: 'Facebook', connected: false },
  { id: 'x', name: 'X', connected: false },
  { id: 'linkedin', name: 'LinkedIn', connected: false },
];

// Replace this boundary with provider-specific OAuth services when they are available.
export async function connectSocialAccount(_platformId: SocialPlatformId): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 850));
}
