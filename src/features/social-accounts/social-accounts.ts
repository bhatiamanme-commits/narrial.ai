export type SocialPlatformId = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'x' | 'linkedin';

export type SocialPlatform = {
  id: SocialPlatformId;
  name: string;
  connected: boolean;
  verified: boolean;
};

export type SocialAccount = {
  id: string;
  platform: SocialPlatformId;
  displayName: string;
  username: string;
  connectionStatus: 'connected' | 'expired' | 'disconnected';
  tokenStatus: 'valid' | 'expired';
};

export const INITIAL_SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', name: 'Instagram', connected: false, verified: false },
  { id: 'tiktok', name: 'TikTok', connected: false, verified: false },
  { id: 'youtube', name: 'YouTube', connected: false, verified: false },
  { id: 'facebook', name: 'Facebook', connected: false, verified: false },
  { id: 'x', name: 'X', connected: false, verified: false },
  { id: 'linkedin', name: 'LinkedIn', connected: false, verified: false },
];

let connectedAccounts: SocialAccount[] = [];
let selectedPublishingTargets: string[] = [];

const accountIdentity: Record<SocialPlatformId, Pick<SocialAccount, 'displayName' | 'username'>> = {
  instagram: { displayName: 'Narrial Studio', username: '@narrial.ai' },
  tiktok: { displayName: 'Narrial Creators', username: '@narrial' },
  youtube: { displayName: 'Narrial AI', username: '@NarrialAI' },
  facebook: { displayName: 'Narrial AI', username: 'Narrial Studio' },
  x: { displayName: 'Narrial AI', username: '@NarrialAI' },
  linkedin: { displayName: 'Narrial AI', username: 'Narrial AI' },
};

const wait = (duration = 450) => new Promise((resolve) => setTimeout(resolve, duration));

// Replace these functions with authenticated API calls; screens only consume this boundary.
export async function getConnectedSocialAccounts(): Promise<SocialAccount[]> {
  await wait(350);
  return connectedAccounts.map((account) => ({ ...account }));
}

export function getSavedPublishingTargets(): string[] {
  return [...selectedPublishingTargets];
}

export async function connectSocialAccount(platformId: SocialPlatformId): Promise<{ connected: boolean; verified: boolean; account: SocialAccount }> {
  await new Promise((resolve) => setTimeout(resolve, 850));
  const existing = connectedAccounts.find((account) => account.platform === platformId);
  const account: SocialAccount = existing ?? {
    id: `${platformId}-primary`,
    platform: platformId,
    ...accountIdentity[platformId],
    connectionStatus: 'connected',
    tokenStatus: 'valid',
  };
  connectedAccounts = [...connectedAccounts.filter((item) => item.id !== account.id), account];
  selectedPublishingTargets = [...new Set([...selectedPublishingTargets, account.id])];
  return { connected: true, verified: true, account: { ...account } };
}

export async function disconnectAllSocialAccounts(): Promise<void> {
  await wait(250);
  connectedAccounts = [];
  selectedPublishingTargets = [];
}

export async function savePublishingTargets(accountIds: string[]): Promise<void> {
  await wait(350);
  const validIds = new Set(connectedAccounts.filter((account) => account.connectionStatus === 'connected' && account.tokenStatus === 'valid').map((account) => account.id));
  if (accountIds.some((id) => !validIds.has(id))) throw new Error('One or more selected accounts require reconnection.');
  selectedPublishingTargets = [...accountIds];
}
