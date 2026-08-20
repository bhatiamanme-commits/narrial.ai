import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearSocialAccountState,
  connectSocialAccount,
  disconnectAllSocialAccounts,
  getConnectedSocialAccounts,
  getSavedPublishingTargets,
  savePublishingTargets,
} from './social-accounts.ts';

test('a later disconnect wins over an in-flight connect for the same user', async () => {
  const userId = 'connect-then-disconnect-user';
  clearSocialAccountState(userId);

  const connect = connectSocialAccount(userId, 'instagram');
  const disconnect = disconnectAllSocialAccounts(userId);

  await Promise.all([connect, disconnect]);

  assert.deepEqual(await getConnectedSocialAccounts(userId), []);
  assert.deepEqual(getSavedPublishingTargets(userId), []);
});

test('publishing targets retain unique valid connected account IDs', async () => {
  const userId = 'deduplicated-publishing-targets-user';
  clearSocialAccountState(userId);
  const { account } = await connectSocialAccount(userId, 'instagram');

  await savePublishingTargets(userId, [account.id, account.id]);
  assert.deepEqual(getSavedPublishingTargets(userId), [account.id]);

  await assert.rejects(
    savePublishingTargets(userId, [account.id, 'disconnected-account']),
    /require reconnection/,
  );
  assert.deepEqual(getSavedPublishingTargets(userId), [account.id]);
});
