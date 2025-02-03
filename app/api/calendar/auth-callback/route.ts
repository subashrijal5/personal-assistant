import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/calendar/auth-callback'
    );

    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token received' },
        { status: 400 }
      );
    }

    // Display the refresh token in a more user-friendly way
    const html = `
      <html>
        <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
            <h2>Your Refresh Token</h2>
            <p style="word-break: break-all; margin: 20px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
              ${refreshToken}
            </p>
            <p>Please copy this refresh token and add it to your .env.local file as GOOGLE_REFRESH_TOKEN</p>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
