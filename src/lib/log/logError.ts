import * as Sentry from "@sentry/nextjs";
import { logger } from "./pino";

type ErrorContext = Record<string, unknown>;

export function logError(error: unknown, context?: ErrorContext): void {
  const err = error instanceof Error ? error : new Error(String(error));

  logger.error({ err, ...context }, err.message);

  Sentry.captureException(err, context ? { extra: context } : undefined);
}
