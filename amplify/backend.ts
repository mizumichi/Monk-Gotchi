import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { generateHarvestAdviceFn } from './functions/generate-harvest-advice/resource';

const backend = defineBackend({
  auth,
  data,
  generateHarvestAdviceFn,
});

// Cognito default requires uppercase/lowercase/digits/symbols.
// Override to allow minimum 8 characters only.
const { cfnUserPool } = backend.auth.resources.cfnResources;
cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: false,
    requireUppercase: false,
    requireNumbers: false,
    requireSymbols: false,
  },
};
