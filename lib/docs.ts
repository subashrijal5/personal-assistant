import { google } from "googleapis";
import { cookies } from "next/headers";
import { validateAndRefreshToken } from "./google-auth";

async function getDocsClient() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("google_refresh_token");

  if (!refreshToken?.value) {
    throw new Error("No refresh token found. Please authenticate first.");
  }

  const { valid, client } = await validateAndRefreshToken(refreshToken.value);

  if (!valid || !client) {
    throw new Error("Invalid or expired token. Please authenticate again.");
  }

  return {
    docs: google.docs({ version: "v1", auth: client }),
    drive: google.drive({ version: "v3", auth: client }),
  };
}

interface DocParams {
  title: string;
  content?: string;
  folderId?: string;
}

interface DocFormatRequest {
  text: string;
  style?: 'HEADING_1' | 'HEADING_2' | 'NORMAL_TEXT';
  bullet?: boolean;
  bold?: boolean;
  italic?: boolean;
}

function createTextRequest(params: DocFormatRequest, index: number) {
  const requests: unknown[] = [];
  const endIndex = index + params.text.length;

  // Insert the text
  requests.push({
    insertText: {
      location: { index },
      text: params.text + '\n'
    }
  });

  // Apply paragraph style if specified
  if (params.style) {
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: index, endIndex: endIndex + 1 },
        paragraphStyle: { namedStyleType: params.style },
        fields: 'namedStyleType'
      }
    });
  }

  // Apply bullet style if specified
  if (params.bullet) {
    requests.push({
      createParagraphBullets: {
        range: { startIndex: index, endIndex: endIndex + 1 },
        bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
      }
    });
  }

  // Apply text style if specified
  if (params.bold || params.italic) {
    requests.push({
      updateTextStyle: {
        range: { startIndex: index, endIndex: endIndex },
        textStyle: {
          bold: params.bold || null,
          italic: params.italic || null
        },
        fields: 'bold,italic'
      }
    });
  }

  return requests;
}

function formatContent(content: string) {
  const lines = content.split('\n');
  let requests: unknown[] = [];
  let currentIndex = 1; // Start at 1 because 0 is reserved

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: '\n'
        }
      });
      currentIndex += 1;
      return;
    }

    const formatRequest: DocFormatRequest = {
      text: trimmedLine
    };

    // Check for headings
    if (line.startsWith('Title:')) {
      formatRequest.text = line.slice(6).trim();
      formatRequest.style = 'HEADING_1';
      formatRequest.bold = true;
    } else if (line.startsWith('Section:')) {
      formatRequest.text = line.slice(8).trim();
      formatRequest.style = 'HEADING_2';
    } else if (line.startsWith('•')) {
      formatRequest.text = line.slice(1).trim();
      formatRequest.bullet = true;
    } else {
      formatRequest.style = 'NORMAL_TEXT';
    }

    requests = requests.concat(createTextRequest(formatRequest, currentIndex));
    currentIndex += formatRequest.text.length + 1;
  });

  return requests;
}

export const EXAMPLE_STRUCTURES = {
  MEETING_STRUCTURE: [
    "Title",
    "Date and Time",
    "Attendees",
    "Agenda Items",
    "Discussion Points",
    "Action Items",
    "Next Steps"
  ],
  PROJECT_STRUCTURE: [
    "Project Title",
    "Overview",
    "Objectives",
    "Timeline",
    "Resources",
    "Risks and Mitigation"
  ],
  REPORT_STRUCTURE: [
    "Title",
    "Executive Summary",
    "Key Findings",
    "Analysis",
    "Recommendations",
    "Conclusion"
  ],
} as const;

export async function createDoc({ title, content, folderId }: DocParams) {
  try {
    const { docs, drive } = await getDocsClient();

    // First create an empty document
    const fileMetadata = {
      name: title,
      mimeType: "application/vnd.google-apps.document",
      parents: folderId ? [folderId] : undefined,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id, webViewLink",
    });

    if (!file.data.id) {
      throw new Error("Failed to create document");
    }

    // If content is provided, format and update the document
    if (content) {
      await docs.documents.batchUpdate({
        documentId: file.data.id,
        requestBody: {
          requests: formatContent(content),
        },
      });
    }

    // Get the document link
    const webViewLink = file.data.webViewLink;

    return {
      success: true,
      doc: {
        id: file.data.id,
        title,
        link: webViewLink,
      },
    };
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
}

export async function updateDoc(documentId: string, content: string) {
  try {
    const { docs } = await getDocsClient();

    // First clear the document content
    const document = await docs.documents.get({ documentId });
    const endIndex = document.data.body?.content?.length || 1;

    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            deleteContentRange: {
              range: {
                startIndex: 1,
                endIndex,
              },
            },
          },
          {
            insertText: {
              location: {
                index: 1,
              },
              text: content,
            },
          },
        ],
      },
    });

    return {
      success: true,
      message: "Document updated successfully",
    };
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
}

export async function listDocs() {
  try {
    const { drive } = await getDocsClient();
    
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.document'",
      fields: "files(id, name, webViewLink, createdTime)",
      orderBy: "createdTime desc",
      pageSize: 10,
    });

    return response.data.files || [];
  } catch (error) {
    console.error("Error listing documents:", error);
    throw error;
  }
}
