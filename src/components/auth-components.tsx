import { SvgXml } from 'react-native-svg';

export type AuthIconName = 'user' | 'mail' | 'lock' | 'eye' | 'eye-off' | 'chevron-left' | 'sparkle';

const iconPaths: Record<AuthIconName, string> = {
  user: '<circle cx="12" cy="7" r="4"/><path d="M4.5 21v-2.5A5.5 5.5 0 0 1 10 13h4a5.5 5.5 0 0 1 5.5 5.5V21z"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>',
  lock: '<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3"/><path d="M12 15v3"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="m3 3 18 18"/><path d="M10.6 6.1A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3 3.8M6.2 6.3C3.5 8 2 12 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.8-.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  sparkle: '<path fill="currentColor" stroke="none" d="M12 1c.8 6.7 4.3 10.2 11 11-6.7.8-10.2 4.3-11 11C11.2 16.3 7.7 12.8 1 12 7.7 11.2 11.2 7.7 12 1z"/>',
};

export function AuthIcon({ name, size = 24, color = '#9DFF00' }: { name: AuthIconName; size?: number; color?: string }) {
  const fill = name === 'sparkle' ? `fill="${color}"` : 'fill="none"';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${fill} stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name].replace('currentColor', color)}</svg>`;
  return <SvgXml xml={svg} width={size} height={size} />;
}
