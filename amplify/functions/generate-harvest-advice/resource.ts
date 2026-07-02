import { defineFunction, secret } from '@aws-amplify/backend';

export const generateHarvestAdviceFn = defineFunction({
  name: 'generate-harvest-advice',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    GEMINI_API_KEY: secret('GEMINI_API_KEY'),
    GEMINI_MODEL: 'gemini-2.5-flash',
  },
});
