// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b66dabaff0ed861479e842c0a6c69436@o4512005978324992.ingest.de.sentry.io/4512005982650448",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Define how likely Replay events are sampled.
  replaysSessionSampleRate: 0, // plus de replay en continu — coûteux en data sur connexion mobile variable

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0, // conservé : capture le replay uniquement si une erreur survient

  dataCollection: {},
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
