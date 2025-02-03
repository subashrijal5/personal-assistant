import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { validateAndRefreshToken } from './google-auth';

async function getKeepClient() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('google_refresh_token');

  if (!refreshToken?.value) {
    throw new Error('No refresh token found. Please authenticate first.');
  }

  const { valid, client } = await validateAndRefreshToken(refreshToken.value);
  
  if (!valid || !client) {
    throw new Error('Invalid or expired token. Please authenticate again.');
  }

  return google.keep({ version: 'v1', auth: client });
}

interface NoteParams {
  title: string;
  content: string;
  tags?: string[];
}

interface SearchParams {
  query: string;
  tags?: string[];
}

export async function createNote({ title, content, tags = [] }: NoteParams) {
  try {
    const keep = await getKeepClient();
    
    const note = await keep.notes.create({
      requestBody: {
        title,
        textContent: content,
        labels: tags.map(tag => ({
          name: tag
        }))
      }
    });

    return {
      success: true,
      note: {
        id: note.data.name,
        title: note.data.title,
        content: note.data.textContent,
        tags: note.data.labels?.map(label => label.name) || [],
        createdAt: note.data.createTime
      }
    };
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

export async function searchNotes({ query, tags = [] }: SearchParams) {
  try {
    const keep = await getKeepClient();
    
    const filter = [];
    if (query) {
      filter.push(`text_content:"${query}" OR title:"${query}"`);
    }
    if (tags.length > 0) {
      const labelFilter = tags.map(tag => `label:"${tag}"`).join(' OR ');
      filter.push(`(${labelFilter})`);
    }

    const response = await keep.notes.list({
      filter: filter.join(' AND '),
      orderBy: 'create_time desc'
    });

    return (response.data.notes || []).map(note => ({
      id: note.name,
      title: note.title,
      content: note.textContent,
      tags: note.labels?.map(label => label.name) || [],
      createdAt: note.createTime
    }));
  } catch (error) {
    console.error('Error searching notes:', error);
    throw error;
  }
}
