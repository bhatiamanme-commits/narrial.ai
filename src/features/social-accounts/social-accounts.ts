export type SocialPlatformId = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'x' | 'linkedin';

export type SocialPlatform = {
  id: SocialPlatformId;
  name: string;
  connected: boolean;
  verified: boolean;
  avatarUrl?: string;
};

export type SocialAccount = {
  id: string;
  platform: SocialPlatformId;
  displayName: string;
  username: string;
  connectionStatus: 'connected' | 'expired' | 'disconnected';
  tokenStatus: 'valid' | 'expired';
  verificationStatus: 'verified' | 'pending' | 'failed';
  avatarUrl?: string;
};

export const isSocialAccountValid = (account: SocialAccount) => account.connectionStatus === 'connected' && account.tokenStatus === 'valid' && account.verificationStatus === 'verified';

export const INITIAL_SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', name: 'Instagram', connected: false, verified: false },
  { id: 'tiktok', name: 'TikTok', connected: false, verified: false },
  { id: 'youtube', name: 'YouTube', connected: false, verified: false },
  { id: 'facebook', name: 'Facebook', connected: false, verified: false },
  { id: 'x', name: 'X', connected: false, verified: false },
  { id: 'linkedin', name: 'LinkedIn', connected: false, verified: false },
];

type UserSocialAccountState = { connectedAccounts: SocialAccount[]; selectedPublishingTargets: string[] };
const socialAccountStateByUser = new Map<string, UserSocialAccountState>();
const socialAccountOperationVersionByUser = new Map<string, number>();

function beginSocialAccountMutation(userId: string): number {
  if (!userId) throw new Error('An authenticated user is required.');
  const version = (socialAccountOperationVersionByUser.get(userId) ?? 0) + 1;
  socialAccountOperationVersionByUser.set(userId, version);
  return version;
}

function isCurrentSocialAccountMutation(userId: string, version: number): boolean {
  return socialAccountOperationVersionByUser.get(userId) === version;
}

function getUserState(userId: string): UserSocialAccountState {
  if (!userId) throw new Error('An authenticated user is required.');
  const existing = socialAccountStateByUser.get(userId);
  if (existing) return existing;
  const created = { connectedAccounts: [], selectedPublishingTargets: [] };
  socialAccountStateByUser.set(userId, created);
  return created;
}

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
export async function getConnectedSocialAccounts(userId: string): Promise<SocialAccount[]> {
  await wait(350);
  return getUserState(userId).connectedAccounts.map((account) => ({ ...account }));
}

export function getSavedPublishingTargets(userId: string): string[] {
  return [...getUserState(userId).selectedPublishingTargets];
}

export function getSavedPublishingPlatforms(userId: string): SocialPlatformId[] {
  const state = getUserState(userId);
  const selectedIds = new Set(state.selectedPublishingTargets);
  return state.connectedAccounts.filter((account) => selectedIds.has(account.id) && isSocialAccountValid(account)).map((account) => account.platform);
}

export async function connectSocialAccount(userId: string, platformId: SocialPlatformId): Promise<{ connected: boolean; verified: boolean; account: SocialAccount }> {
  const operationVersion = beginSocialAccountMutation(userId);
  await new Promise((resolve) => setTimeout(resolve, 850));
  const state = getUserState(userId);
  const existing = state.connectedAccounts.find((account) => account.platform === platformId);
  const accountDetails = existing ?? {
    id: `${platformId}-primary`,
    platform: platformId,
    ...accountIdentity[platformId],
  };
  if (!isCurrentSocialAccountMutation(userId, operationVersion)) {
    return {
      connected: false,
      verified: false,
      account: {
        ...accountDetails,
        connectionStatus: 'disconnected',
        tokenStatus: 'expired',
        verificationStatus: 'pending',
      },
    };
  }
  const account: SocialAccount = {
    ...accountDetails,
    connectionStatus: 'connected',
    tokenStatus: 'valid',
    verificationStatus: 'verified',
  };
  state.connectedAccounts = [...state.connectedAccounts.filter((item) => item.id !== account.id), account];
  state.selectedPublishingTargets = [...new Set([...state.selectedPublishingTargets, account.id])];
  return { connected: true, verified: true, account: { ...account } };
}

export function recordYouTubeConnection(userId: string, connection: { id: string; channel: { title: string; thumbnailUrl?: string }; status: 'CONNECTED' | 'RECONNECT_REQUIRED' | 'DISCONNECTED' }): { connected: boolean; verified: boolean; account: SocialAccount } {
  const state = getUserState(userId);
  const connected = connection.status === 'CONNECTED';
  const account: SocialAccount = {
    id: connection.id,
    platform: 'youtube',
    displayName: connection.channel.title,
    username: 'YouTube channel',
    ...(connection.channel.thumbnailUrl ? { avatarUrl: connection.channel.thumbnailUrl } : {}),
    connectionStatus: connected ? 'connected' : connection.status === 'RECONNECT_REQUIRED' ? 'expired' : 'disconnected',
    tokenStatus: connected ? 'valid' : 'expired',
    verificationStatus: connected ? 'verified' : 'failed',
  };
  state.connectedAccounts = [...state.connectedAccounts.filter((item) => item.platform !== 'youtube'), account];
  if (connected) state.selectedPublishingTargets = [...new Set([...state.selectedPublishingTargets, account.id])];
  return { connected, verified: connected, account: { ...account } };
}

export async function disconnectAllSocialAccounts(userId: string): Promise<void> {
  const operationVersion = beginSocialAccountMutation(userId);
  await wait(250);
  if (!isCurrentSocialAccountMutation(userId, operationVersion)) return;
  socialAccountStateByUser.set(userId, { connectedAccounts: [], selectedPublishingTargets: [] });
}

export async function savePublishingTargets(userId: string, accountIds: string[]): Promise<void> {
  await wait(350);
  const state = getUserState(userId);
  const validIds = new Set(state.connectedAccounts.filter(isSocialAccountValid).map((account) => account.id));
  const selectedIds = [...new Set(accountIds)];
  if (selectedIds.some((id) => !validIds.has(id))) throw new Error('One or more selected accounts require reconnection.');
  state.selectedPublishingTargets = selectedIds;
}

export function clearSocialAccountState(userId: string): void {
  beginSocialAccountMutation(userId);
  socialAccountStateByUser.delete(userId);
}
