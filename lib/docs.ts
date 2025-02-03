import { google } from "googleapis";
import { cookies } from "next/headers";
import { validateAndRefreshToken } from "./google-auth";
import { marked } from "marked";
import HTMLtoDOCX from "html-to-docx";

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

async function markdownToDocx(markdown: string) {
  // Convert markdown to HTML using marked
  const html = await marked(markdown);

  // Configure html-to-docx options
  const options = {
    margins: {
      top: 1440, // 1 inch
      right: 1440,
      bottom: 1440,
      left: 1440,
    },
    font: "Arial",
    fontSize: 14,
    title: "Converted Document",
  };

  // Convert HTML to DOCX buffer
  const buffer = await HTMLtoDOCX(html, null, options);
  return buffer;
}

export const EXAMPLE_STRUCTURES = {
  MEETING_STRUCTURE: [
    "Title",
    "Date and Time",
    "Attendees",
    "Agenda Items",
    "Discussion Points",
    "Action Items",
    "Next Steps",
  ],
  PROJECT_STRUCTURE: [
    "Project Title",
    "Overview",
    "Objectives",
    "Timeline",
    "Resources",
    "Risks and Mitigation",
  ],
  REPORT_STRUCTURE: [
    "Title",
    "Executive Summary",
    "Key Findings",
    "Analysis",
    "Recommendations",
    "Conclusion",
  ],
} as const;

export async function createDoc({ title, content, folderId }: DocParams) {
  try {
    const { drive } = await getDocsClient();

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

    // If content is provided, convert markdown to docx and upload
    if (content) {
      // Convert markdown to DOCX
      const docxBuffer = await markdownToDocx(content);

      // Upload the DOCX file
      await drive.files.update({
        fileId: file.data.id,
        media: {
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          body: docxBuffer,
        },
      });

      // Convert the uploaded DOCX to Google Docs format
      await drive.files.copy({
        fileId: file.data.id,
        requestBody: {
          mimeType: "application/vnd.google-apps.document",
          name: title,
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

export async function listDocs(query?: string) {
  try {
    const { drive } = await getDocsClient();

    // Base query to get only Google Docs
    let searchQuery = "mimeType='application/vnd.google-apps.document'";

    // If search query is provided, add it to the search
    if (query) {
      // Escape single quotes in the query
      const escapedQuery = query.replace(/'/g, "\\'");
      // Search in both title and full text
      searchQuery += ` and (name contains '${escapedQuery}' or fullText contains '${escapedQuery}')`;
    }

    const response = await drive.files.list({
      q: searchQuery,
      fields: "files(id, name, webViewLink, createdTime, description, mimeType)",
      pageSize: 10, // Limit results to most relevant matches
      ...(query ? {} : { orderBy: "modifiedTime desc" }) // Only use orderBy when not searching
    });

    // Add export links to each file for easier content access later
    const files = response.data.files || [];
    for (const file of files) {
      const fileResponse = await drive.files.get({
        fileId: file.id!,
        fields: 'exportLinks'
      });
      file.exportLinks = fileResponse.data.exportLinks;
    }

    return response.data.files || [];
  } catch (error) {
    console.error("Error listing documents:", error);
    throw error;
  }
}
