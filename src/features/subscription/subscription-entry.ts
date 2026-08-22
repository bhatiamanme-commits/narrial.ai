const dismissedSubscriptionUsers = new Set<string>();

export function shouldShowSubscriptionForSession(userId: string): boolean {
  return !dismissedSubscriptionUsers.has(userId);
}

export function dismissSubscriptionForSession(userId: string): void {
  dismissedSubscriptionUsers.add(userId);
}

export function resetSubscriptionSession(userId: string): void {
  dismissedSubscriptionUsers.delete(userId);
}
