import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { validateAndRefreshToken } from './google-auth';

async function getGmailClient() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('google_refresh_token');

  if (!refreshToken?.value) {
    throw new Error('No refresh token found. Please authenticate first.');
  }

  const { valid, client } = await validateAndRefreshToken(refreshToken.value);
  
  if (!valid || !client) {
    throw new Error('Invalid or expired token. Please authenticate again.');
  }

  return google.gmail({ version: 'v1', auth: client });
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
    
    const message = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : '',
      bcc ? `Bcc: ${bcc}` : '',
      `Subject: ${subject}`,
      '',
      body,
    ]
      .filter(Boolean)
      .join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      success: true,
      messageId: res.data.id,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function getEmails(count: number = 10, folder: string = 'INBOX') {
  try {
    const gmail = await getGmailClient();
    
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: count,
      labelIds: [folder],
    });

    if (!res.data.messages) {
      return [];
    }

    const emails = await Promise.all(
      res.data.messages.map(async (message) => {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
        });

        const headers = email.data.payload?.headers;
        const subject = headers?.find((h) => h.name === 'Subject')?.value;
        const from = headers?.find((h) => h.name === 'From')?.value;
        const date = headers?.find((h) => h.name === 'Date')?.value;

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
    console.error('Error fetching emails:', error);
    throw error;
  }
}
