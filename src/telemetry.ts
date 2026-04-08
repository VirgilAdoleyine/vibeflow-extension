import { PostHog } from 'posthog-node';

const posthog = new PostHog(
  'phc_sB7RJrMXDaGh58MkYkAiPqqdCRPf7tpPfLH2AUMaowgE',
  { 
    host: 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 10000
  }
);

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  try {
    posthog.capture({
      distinctId: 'vscode-user',
      event: eventName,
      properties: {
        version: '2.0.4',
        platform: process.platform,
        timestamp: Date.now(),
        ...properties
      }
    });
  } catch (error) {
    console.error('Telemetry error:', error);
  }
}

export async function shutdownTelemetry() {
  await posthog.shutdown();
}
