import { NextResponse } from 'next/server';
import { getGoogleAuthClient, SCOPES } from '@/lib/google-auth';
import { cookies } from 'next/headers';

export async function GET() {
  // Clear any existing refresh token
  const cookieStore = await cookies();
  cookieStore.delete('google_refresh_token');

  const oauth2Client = getGoogleAuthClient();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent screen
    include_granted_scopes: true,
  });

  return NextResponse.redirect(authUrl);
}
