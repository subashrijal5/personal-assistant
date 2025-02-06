import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthClient } from "@/lib/server/google-auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/auth-error?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/auth-error?error=no_code`);
  }

  try {
    const oauth2Client = getGoogleAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        `${baseUrl}/auth-error?error=no_refresh_token`
      );
    }

    // Store refresh token in an HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("google_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.redirect(`${baseUrl}/auth-success`);
  } catch (error: unknown) {
    console.error("OAuth callback error:", error);
    const errorMessage = (error as Error).message || "token_exchange_failed";
    return NextResponse.redirect(
      `${baseUrl}/auth-error?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
