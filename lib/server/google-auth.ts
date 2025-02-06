import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";


export const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/docs",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/tasks.readonly",
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/cloud-language",
  "https://www.googleapis.com/auth/cloud-speech",
  "https://www.googleapis.com/auth/cse"

];

export function getGoogleAuthClient() {
  return new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
  });
}

export function getGoogleServices(auth: OAuth2Client) {
  return {
    calendar: google.calendar({ version: "v3", auth }),
    drive: google.drive({ version: "v3", auth }),
    docs: google.docs({ version: "v1", auth }),
    sheets: google.sheets({ version: "v4", auth }),
    gmail: google.gmail({ version: "v1", auth }),
    tasks: google.tasks({ version: "v1", auth }),
    places: google.places({ version: "v1", auth }),
    speech: google.speech({ version: "v1", auth }),
    texttospeech: google.texttospeech({ version: "v1", auth }),
    customsearch: google.customsearch({ version: "v1", auth }),
  };
}

export async function validateAndRefreshToken(refreshToken: string) {
  const oauth2Client = getGoogleAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return {
      valid: true,
      credentials,
      client: oauth2Client,
    };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return {
      valid: false,
      credentials: null,
      client: null,
    };
  }
}
