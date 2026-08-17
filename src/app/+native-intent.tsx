type NativeIntent = { path: string; initial: boolean };

export function redirectSystemPath({ path }: NativeIntent) {
  try {
    const url = new URL(path, 'narrial://app');
    const marker = '/--/';

    if (url.pathname === '/--') return '/';
    if (url.pathname.startsWith(marker)) {
      return `/${url.pathname.slice(marker.length)}${url.search}${url.hash}`;
    }
  } catch {
    return path;
  }

  return path;
}
