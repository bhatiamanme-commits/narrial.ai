const nodeEnvironments = ['development', 'test', 'production'] as const;
const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

export interface AppConfig {
  nodeEnv: (typeof nodeEnvironments)[number];
  host: string;
  port: number;
  logLevel: (typeof logLevels)[number];
  allowedWebOrigins: string[];
  clerkPublishableKey: string;
  clerkSecretKey: string;
  requestTimeoutMs: number;
  handlerTimeoutMs: number;
  keepAliveTimeoutMs: number;
  shutdownGracePeriodMs: number;
}

export class ConfigError extends Error {
  constructor(fields: string[]) {
    super(`Invalid configuration fields: ${fields.join(', ')}`);
    this.name = 'ConfigError';
  }
}

function isOneOf<T extends string>(value: string | undefined, allowed: readonly T[]): value is T {
  return value !== undefined && allowed.includes(value as T);
}

function parseInteger(value: string | undefined, minimum: number, maximum: number) {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

function parseOrigins(value: string | undefined) {
  if (!value) return undefined;

  const origins = value.split(',').map((origin) => origin.trim());
  if (origins.some((origin) => !origin || origin.includes('*'))) return undefined;

  try {
    const parsed = origins.map((origin) => new URL(origin));
    if (
      parsed.some(
        (url, index) =>
          !['http:', 'https:'].includes(url.protocol) || url.origin !== origins[index],
      )
    ) {
      return undefined;
    }
  } catch {
    return undefined;
  }

  return [...new Set(origins)];
}

export function loadConfig(environment: NodeJS.ProcessEnv): AppConfig {
  const invalidFields: string[] = [];
  const nodeEnv = isOneOf(environment.NODE_ENV, nodeEnvironments)
    ? environment.NODE_ENV
    : undefined;
  const host = environment.HOST?.trim() || undefined;
  const port = parseInteger(environment.PORT, 1, 65_535);
  const logLevel = isOneOf(environment.LOG_LEVEL, logLevels)
    ? environment.LOG_LEVEL
    : undefined;
  const allowedWebOrigins = parseOrigins(environment.ALLOWED_WEB_ORIGINS);
  const clerkPublishableKey = environment.CLERK_PUBLISHABLE_KEY?.trim() || undefined;
  const clerkSecretKey = environment.CLERK_SECRET_KEY?.trim() || undefined;
  const requestTimeoutMs = parseInteger(environment.REQUEST_TIMEOUT_MS, 1, 300_000);
  const handlerTimeoutMs = parseInteger(environment.HANDLER_TIMEOUT_MS, 1, 300_000);
  const keepAliveTimeoutMs = parseInteger(environment.KEEP_ALIVE_TIMEOUT_MS, 1, 300_000);
  const shutdownGracePeriodMs = parseInteger(
    environment.SHUTDOWN_GRACE_PERIOD_MS,
    1,
    60_000,
  );

  const values = {
    NODE_ENV: nodeEnv,
    HOST: host,
    PORT: port,
    LOG_LEVEL: logLevel,
    ALLOWED_WEB_ORIGINS: allowedWebOrigins,
    CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
    CLERK_SECRET_KEY: clerkSecretKey,
    REQUEST_TIMEOUT_MS: requestTimeoutMs,
    HANDLER_TIMEOUT_MS: handlerTimeoutMs,
    KEEP_ALIVE_TIMEOUT_MS: keepAliveTimeoutMs,
    SHUTDOWN_GRACE_PERIOD_MS: shutdownGracePeriodMs,
  };

  for (const [field, value] of Object.entries(values)) {
    if (value === undefined) invalidFields.push(field);
  }

  if (invalidFields.length > 0) throw new ConfigError(invalidFields);

  return {
    nodeEnv: nodeEnv!,
    host: host!,
    port: port!,
    logLevel: logLevel!,
    allowedWebOrigins: allowedWebOrigins!,
    clerkPublishableKey: clerkPublishableKey!,
    clerkSecretKey: clerkSecretKey!,
    requestTimeoutMs: requestTimeoutMs!,
    handlerTimeoutMs: handlerTimeoutMs!,
    keepAliveTimeoutMs: keepAliveTimeoutMs!,
    shutdownGracePeriodMs: shutdownGracePeriodMs!,
  };
}
