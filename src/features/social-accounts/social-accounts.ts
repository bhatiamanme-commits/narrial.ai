export type SocialPlatformId = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'x' | 'linkedin';

export type SocialPlatform = {
  id: SocialPlatformId;
  name: string;
  connected: boolean;
  verified: boolean;
};

export const INITIAL_SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', name: 'Instagram', connected: false, verified: false },
  { id: 'tiktok', name: 'TikTok', connected: false, verified: false },
  { id: 'youtube', name: 'YouTube', connected: false, verified: false },
  { id: 'facebook', name: 'Facebook', connected: false, verified: false },
  { id: 'x', name: 'X', connected: false, verified: false },
  { id: 'linkedin', name: 'LinkedIn', connected: false, verified: false },
];

// Replace this boundary with provider-specific OAuth services when they are available.
export async function connectSocialAccount(_platformId: SocialPlatformId): Promise<{ connected: boolean; verified: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 850));
  return { connected: false, verified: false };
}
