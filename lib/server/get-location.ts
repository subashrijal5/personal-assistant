import { validateAndRefreshToken } from "./google-auth";
import { cookies } from "next/headers";

interface GeolocationResponse {
  location: {
    lat: number;
    lng: number;
  };
  accuracy: number;
}

export async function getLocation(): Promise<GeolocationResponse> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("google_refresh_token");

    if (!refreshToken?.value) {
      throw new Error("No refresh token found. Please authenticate first.");
    }

    const { valid, client } = await validateAndRefreshToken(refreshToken.value);

    if (!valid || !client) {
      throw new Error("Invalid or expired token. Please authenticate again.");
    }

    const url = "https://www.googleapis.com/geolocation/v1/geolocate";
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${client.credentials.access_token}`,
      },
      method: "POST",
      body: JSON.stringify({
        considerIp: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Geolocation API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("🚀 ~ file: get-location.ts:44 ~ data:", data)
    return data;
  } catch (error) {
    console.error("Error getting location:", error);
    throw error;
  }
}
