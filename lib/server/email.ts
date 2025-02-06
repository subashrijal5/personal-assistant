import { google } from "googleapis";
import { cookies } from "next/headers";
import { validateAndRefreshToken } from "./google-auth";

async function getGmailClient() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("google_refresh_token");

  if (!refreshToken?.value) {
    throw new Error("No refresh token found. Please authenticate first.");
  }

  const { valid, client } = await validateAndRefreshToken(refreshToken.value);

  if (!valid || !client) {
    throw new Error("Invalid or expired token. Please authenticate again.");
  }

  return google.gmail({ version: "v1", auth: client });
}

interface EmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export async function sendEmail({ to, subject, body, cc, bcc }: EmailParams) {
  try {
    const gmail = await getGmailClient();

    // Get user's email for the From field
    const profile = await gmail.users.getProfile({ userId: "me" });
    const fromEmail = profile.data.emailAddress;

    // Format date according to RFC 2822
    const date = new Date().toUTCString();

    // Encode subject for UTF-8
    const encodedSubject = subject
      .split("")
      .map((char) => {
        const code = char.charCodeAt(0);
        return code > 127
          ? `=?UTF-8?B?${Buffer.from(char).toString("base64")}?=`
          : char;
      })
      .join("");

    // Construct email headers according to RFC 2822
    const headers = [
      `From: ${fromEmail}`,
      `Date: ${date}`,
      `To: ${to}`,
      cc ? `Cc: ${cc}` : "",
      bcc ? `Bcc: ${bcc}` : "",
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      `Subject: ${encodedSubject}`,
      "", // Empty line between headers and body is required
      body,
    ]
      .filter(Boolean)
      .join("\r\n"); // RFC 2822 requires CRLF

    const encodedMessage = Buffer.from(headers)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      success: true,
      messageId: res.data.id,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

interface EmailFilters {
  query?: string;
}

export async function getEmails(
  count: number = 10,
  folder: string = "INBOX",
  filters?: EmailFilters
) {
  try {
    const gmail = await getGmailClient();
    
    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: count,
      labelIds: [folder],
      q: filters?.query,
    });

    if (!res.data.messages) {
      return [];
    }

    const emails = await Promise.all(
      res.data.messages.map(async (message) => {
        const email = await gmail.users.messages.get({
          userId: "me",
          id: message.id!,
        });

        const headers = email.data.payload?.headers;
        const subject = headers?.find((h) => h.name === "Subject")?.value;
        const from = headers?.find((h) => h.name === "From")?.value;
        const date = headers?.find((h) => h.name === "Date")?.value;

        return {
          id: message.id,
          subject,
          from,
          date,
          snippet: email.data.snippet,
        };
      })
    );

    return emails;
  } catch (error) {
    console.error("Error fetching emails:", error);
    throw error;
  }
}
