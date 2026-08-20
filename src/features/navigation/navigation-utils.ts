export function getBackAction<T extends string>(canGoBack: boolean, fallback: T): 'back' | T {
  return canGoBack ? 'back' : fallback;
}
