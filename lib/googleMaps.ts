const MAP_LIBRARIES: "places"[] = ["places"];

export const GOOGLE_MAPS_LOADER_OPTIONS = {
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  libraries: MAP_LIBRARIES,
};
