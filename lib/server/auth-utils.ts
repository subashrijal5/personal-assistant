import { cookies } from 'next/headers';
import { validateAndRefreshToken } from './google-auth';

export async function checkGoogleAuth() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('google_refresh_token');

  if (!refreshToken?.value) {
    return { isAuthenticated: false };
  }

  const { valid, credentials } = await validateAndRefreshToken(refreshToken.value);

  return {
    isAuthenticated: valid,
    credentials
  };
}
