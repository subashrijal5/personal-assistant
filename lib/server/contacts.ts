import { google } from "googleapis";
import { cookies } from "next/headers";
import { validateAndRefreshToken } from "./google-auth";


interface ContactInput {
  firstName?: string;
  lastName?: string;
  emailAddresses?: Array<{ value: string; type?: string }>;
  phoneNumbers?: Array<{ value: string; type?: string }>;
  organizations?: Array<{ name: string; title?: string }>;
  birthday?: {
    year?: number;
    month?: number;
    day?: number;
  };
  addresses?: Array<{
    streetAddress?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    type?: string;
  }>;
  birthdays?: Array<{
    date?: {
      year?: number;
      month?: number;
      day?: number;
    };
  }>;
}

async function getPeopleClient() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("google_refresh_token");

  if (!refreshToken?.value) {
    throw new Error("No refresh token found. Please authenticate first.");
  }

  const { valid, client } = await validateAndRefreshToken(refreshToken.value);

  if (!valid || !client) {
    throw new Error("Invalid or expired token. Please authenticate again.");
  }

  return google.people({ version: "v1", auth: client });
}

export async function getContact(resourceName: string) {
  try {
    const people = await getPeopleClient();
    const response = await people.people.get({
      resourceName,
      personFields: "names,emailAddresses,phoneNumbers,organizations,addresses",
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching contact:", error);
    throw error;
  }
}

export async function createContact(contact: ContactInput) {
  try {
    const people = await getPeopleClient();
    const response = await people.people.createContact({
      requestBody: {
        names: [
          {
            givenName: contact.firstName,
            familyName: contact.lastName,
          },
        ],
        emailAddresses: contact.emailAddresses,
        phoneNumbers: contact.phoneNumbers,
        organizations: contact.organizations,
        addresses: contact.addresses,
        birthdays: [
          {
            date: {
              month: contact.birthday?.month,
              day: contact.birthday?.day,
            },
          },
        ],
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating contact:", error);
    throw error;
  }
}

export async function updateContact(
  resourceName: string,
  contact: ContactInput
) {
  try {
    const people = await getPeopleClient();
    const response = await people.people.updateContact({
      resourceName,
      updatePersonFields:
        "names,emailAddresses,phoneNumbers,organizations,addresses",
      requestBody: {
        etag: "*",
        names: [
          {
            givenName: contact.firstName,
            familyName: contact.lastName,
          },
        ],
        emailAddresses: contact.emailAddresses,
        phoneNumbers: contact.phoneNumbers,
        organizations: contact.organizations,
        addresses: contact.addresses,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error updating contact:", error);
    throw error;
  }
}

export async function deleteContact(resourceName: string) {
  try {
    const people = await getPeopleClient();
    await people.people.deleteContact({
      resourceName,
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting contact:", error);
    throw error;
  }
}

export async function searchContacts(query: string) {
  try {
    const people = await getPeopleClient();
    const response = await people.people.searchContacts({
      query,
      readMask: "names,emailAddresses,phoneNumbers",
      pageSize: 30,
    });

    return response.data.results || [];
  } catch (error) {
    console.error("Error searching contacts:", error);
    return {
      results: [],
      error: "Error searching contacts"
    }
  }
}
