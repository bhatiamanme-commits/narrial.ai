import type { FastifyInstance } from 'fastify';

interface ShutdownTarget {
  close(): Promise<unknown>;
  log: { warn(message: string): void };
  server: { closeAllConnections(): void };
}

export async function closeApp(app: ShutdownTarget, gracePeriodMs: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      app.log.warn('graceful shutdown deadline reached');
      app.server.closeAllConnections();
      resolve();
    }, gracePeriodMs);
    timer.unref();
  });

  try {
    await Promise.race([app.close(), deadline]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function registerShutdownHandlers(app: FastifyInstance, gracePeriodMs: number): void {
  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, 'shutdown requested');
    void closeApp(app, gracePeriodMs).catch(() => {
      app.log.error('graceful shutdown failed');
      process.exitCode = 1;
    });
  };
  const onSigint = () => shutdown('SIGINT');
  const onSigterm = () => shutdown('SIGTERM');

  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);
  app.addHook('onClose', (_instance, done) => {
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);
    done();
  });
}
