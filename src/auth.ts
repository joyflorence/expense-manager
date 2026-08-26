import { createAuthClient } from '@neondatabase/neon-js/auth';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;
export const authConfigError = !authUrl
  ? 'Neon Auth is not configured. Set VITE_NEON_AUTH_URL in Netlify and redeploy.'
  : /^https:\/\/YOUR-|YOUR-NEON-AUTH-ENDPOINT/i.test(authUrl)
  ? 'Neon Auth is still using the placeholder URL. Replace VITE_NEON_AUTH_URL in Netlify and redeploy.'
  : null;

export const authClient = createAuthClient(authUrl || 'https://invalid-neon-auth.invalid/auth', {
  adapter: BetterAuthReactAdapter(),
});
