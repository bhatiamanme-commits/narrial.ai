import type { SubscriptionProduct } from './subscription-config';

export async function startSubscriptionCheckout(_product: SubscriptionProduct): Promise<never> {
  throw new Error('Secure checkout is being connected. No payment has been taken.');
}

export async function restoreSubscription(): Promise<never> {
  throw new Error('No subscription provider is connected yet.');
}
