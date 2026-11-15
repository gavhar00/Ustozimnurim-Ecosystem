import * as Sentry from '@sentry/node';

/**
 * Must run before the Nest app is created (Sentry needs to instrument
 * modules as they're required). Safe no-op if SENTRY_DSN is empty —
 * local dev doesn't need a Sentry project to run the app.
 */
export function initSentry(dsn: string, environment: string): void {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
    // Security requirement: never send user message text/PII to Sentry.
    beforeSend(event) {
      if (event.request?.data) {
        delete event.request.data;
      }
      return event;
    },
  });
}
