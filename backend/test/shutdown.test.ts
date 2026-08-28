import { describe, expect, it, vi } from 'vitest';

import { buildApp } from '../src/app.js';
import { closeApp } from '../src/lifecycle/shutdown.js';
import { testConfig } from './fixtures/config.js';

describe('closeApp', () => {
  it('closes normally without forcing active connections', async () => {
    const app = buildApp({ config: testConfig });
    const forceClose = vi.spyOn(app.server, 'closeAllConnections');

    await closeApp(app, 100);

    expect(forceClose).not.toHaveBeenCalled();
  });

  it('forces connections closed when graceful shutdown exceeds its bound', async () => {
    const close = vi.fn(() => new Promise<void>(() => undefined));
    const forceClose = vi.fn();
    const app = {
      close,
      log: { warn: vi.fn() },
      server: { closeAllConnections: forceClose },
    };

    await closeApp(app, 10);

    expect(close).toHaveBeenCalledOnce();
    expect(forceClose).toHaveBeenCalledOnce();
  });
});
