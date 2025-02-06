import { getGoogleServices, validateAndRefreshToken } from "./google-auth";
import { cookies } from "next/headers";

export interface PlaceSearchParams {
  query: string;
  type?: PlaceType;
  radius?: number;
  location?: {
    lat: number;
    lng: number;
  };
  language?: string;
  openNow?: boolean;
}

export enum PlaceType {
  ACCOUNTING = "accounting",
  AIRPORT = "airport",
  AMUSEMENT_PARK = "amusement_park",
  AQUARIUM = "aquarium",
  ART_GALLERY = "art_gallery",
  ATM = "atm",
  BAKERY = "bakery",
  BANK = "bank",
  BAR = "bar",
  BEAUTY_SALON = "beauty_salon",
  BICYCLE_STORE = "bicycle_store",
  BOOK_STORE = "book_store",
  BOWLING_ALLEY = "bowling_alley",
  BUS_STATION = "bus_station",
  CAFE = "cafe",
  CAMPGROUND = "campground",
  CAR_DEALER = "car_dealer",
  CAR_RENTAL = "car_rental",
  CAR_REPAIR = "car_repair",
  CAR_WASH = "car_wash",
  CASINO = "casino",
  CEMETERY = "cemetery",
  CHURCH = "church",
  CITY_HALL = "city_hall",
  CLOTHING_STORE = "clothing_store",
  CONVENIENCE_STORE = "convenience_store",
  COURTHOUSE = "courthouse",
  DENTIST = "dentist",
  DEPARTMENT_STORE = "department_store",
  DOCTOR = "doctor",
  DRUGSTORE = "drugstore",
  ELECTRICIAN = "electrician",
  ELECTRONICS_STORE = "electronics_store",
  EMBASSY = "embassy",
  FIRE_STATION = "fire_station",
  FLOWER_STORE = "flower_store",
  FUNERAL_HOME = "funeral_home",
  FURNITURE_STORE = "furniture_store",
  GAS_STATION = "gas_station",
  GYM = "gym",
  HAIR_CARE = "hair_care",
  HARDWARE_STORE = "hardware_store",
  HINDU_TEMPLE = "hindu_temple",
  HOME_GOODS_STORE = "home_goods_store",
  HOSPITAL = "hospital",
  INSURANCE_AGENCY = "insurance_agency",
  JEWELRY_STORE = "jewelry_store",
  LAUNDRY = "laundry",
  LAWYER = "lawyer",
  LIBRARY = "library",
  LIGHT_RAIL_STATION = "light_rail_station",
  LIQUOR_STORE = "liquor_store",
  LOCAL_GOVERNMENT_OFFICE = "local_government_office",
  LOCKSMITH = "locksmith",
  LODGING = "lodging",
  MEAL_DELIVERY = "meal_delivery",
  MEAL_TAKEAWAY = "meal_takeaway",
  MOSQUE = "mosque",
  MOVIE_RENTAL = "movie_rental",
  MOVIE_THEATER = "movie_theater",
  MOVING_COMPANY = "moving_company",
  MUSEUM = "museum",
  NIGHT_CLUB = "night_club",
  PAINTER = "painter",
  PARK = "park",
  PARKING = "parking",
  PET_STORE = "pet_store",
  PHARMACY = "pharmacy",
  PHYSIOTHERAPIST = "physiotherapist",
  PLUMBER = "plumber",
  POLICE = "police",
  POST_OFFICE = "post_office",
  PRIMARY_SCHOOL = "primary_school",
  REAL_ESTATE_AGENCY = "real_estate_agency",
  RESTAURANT = "restaurant",
  ROOFING_CONTRACTOR = "roofing_contractor",
  RV_PARK = "rv_park",
  SCHOOL = "school",
  SECONDARY_SCHOOL = "secondary_school",
  SHOE_STORE = "shoe_store",
  SHOPPING_MALL = "shopping_mall",
  SPA = "spa",
  STADIUM = "stadium",
  STORAGE = "storage",
  STORE = "store",
  SUBWAY_STATION = "subway_station",
  SUPERMARKET = "supermarket",
  SYNAGOGUE = "synagogue",
  TAXI_STAND = "taxi_stand",
  TOURIST_ATTRACTION = "tourist_attraction",
  TRAIN_STATION = "train_station",
  TRANSIT_STATION = "transit_station",
  TRAVEL_AGENCY = "travel_agency",
  UNIVERSITY = "university",
  VETERINARY_CARE = "veterinary_care",
  ZOO = "zoo",
}

export async function searchPlaces(params: PlaceSearchParams) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("google_refresh_token")?.value;

  if (!refreshToken) {
    throw new Error("Not authenticated");
  }

  try {
    // Validate and refresh the token
    const { valid, client } = await validateAndRefreshToken(refreshToken);
    if (!valid || !client) {
      throw new Error("Failed to validate authentication");
    }

    // Get authenticated services
    const { places } = getGoogleServices(client);

    // Construct search parameters according to Places API v1
    const requestBody = {
      textQuery: params.query,
      languageCode: params.language || "en",
      ...(params.type && { includedTypes: [params.type] }),
      ...(params.location && {
        locationBias: {
          circle: {
            center: {
              latitude: params.location.lat,
              longitude: params.location.lng,
            },
            radius: params.radius || 5000,
          },
        },
      }),
      maxResultCount: 20,
    };

    // Perform place search
    const searchResponse = await places.places.searchText({
      requestBody,
      fields: "*",
    });

    const foundPlaces = searchResponse.data.places || [];

    return {
      places: foundPlaces.map((place) => ({
        name: place.displayName?.text || place.id,
        address: place.formattedAddress,
        location: place.location,
        rating: place.rating?.toLocaleString(),
        totalRatings: place.rating?.toString(),
        placeId: place.id,
        types: place.types,
        photos: place.photos?.map((photo) => photo.name) || [],
        phone: place.nationalPhoneNumber,
        website: place.websiteUri,
        openingHours: place.regularOpeningHours?.weekdayDescriptions,
        priceLevel: place.priceLevel,
        reviews: (place.reviews || [])
          .map((review) => ({
            author: review.authorAttribution?.displayName || "Anonymous",
            rating: review.rating,
            text: review.text?.text || "",
            time: review.relativePublishTimeDescription,
          }))
          .slice(0, 3),
      })),
      total: foundPlaces.length,
    };
  } catch (error) {
    console.error("Google Places API error:", error);
    throw new Error(`Failed to fetch places: ${(error as Error).message}`);
  }
}
