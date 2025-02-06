import { cookies } from "next/headers";
import { getGoogleServices, validateAndRefreshToken } from "./google-auth";

interface SearchParams {
  query: string;
  num?: number;
  timeout?: number;
}

export async function searchWeb({
  query,
  num = 10,
}: SearchParams) {
  console.log("🚀 ~ file: search.ts:12 ~ query:", query)
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("google_refresh_token")?.value;
  try {
    if (!refreshToken) {
      throw new Error("Not authenticated");
    }

    // Validate and refresh the token
    const { valid, client } = await validateAndRefreshToken(refreshToken);
    if (!valid || !client) {
      throw new Error("Failed to validate authentication");
    }

    // Get authenticated services
    const { customsearch } = getGoogleServices(client);

    const response = await customsearch.cse.list({
      q: query,
      num,
      cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
      
    });
    console.log("🚀 ~ file: search.ts:33 ~ response:", response.data.items)
    if (!response.data.items) {
      return { items: [] };
    }

    return {
      items: response.data.items.map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        content: item.htmlSnippet,
      })),
    };
  } catch (error) {
    console.error("Web search error:", error?.response?.data?.error?.errors);
    // throw new Error(
    //   `Failed to search web content: ${(error as Error).message}`
    // );
    return { items: [], message: "Error searching web content" };
  }
}
