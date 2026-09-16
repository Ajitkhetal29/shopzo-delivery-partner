import { Address } from "@/store/types/address";

const mapGoogleComponentsToAddress = (result: google.maps.GeocoderResult): Address => {
  const components = result.address_components || [];

  const getComp = (...types: string[]) =>
    components.find((component) => types.some((type) => component.types.includes(type)))?.long_name || "";

  const city =
    getComp("locality") ||
    getComp("administrative_area_level_3") ||
    getComp("sublocality") ||
    getComp("administrative_area_level_2");

  return {
    formatted: result.formatted_address || "",
    state: getComp("administrative_area_level_1"),
    city,
    pincode: getComp("postal_code"),
    area: getComp("sublocality", "neighborhood"),
    country: getComp("country"),
  };
};

export const getAddress = async ({ lat, lng }: { lat: number; lng: number }): Promise<Address | null> => {
  try {
    if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      const geocodeResult = await new Promise<google.maps.GeocoderResult | null>((resolve) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            resolve(results[0]);
            return;
          }
          resolve(null);
        });
      });

      if (geocodeResult) {
        return mapGoogleComponentsToAddress(geocodeResult);
      }
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
    );
    const data = await response.json();

    if (data.status !== "OK" || !data.results?.length) {
      console.error("Geocoding failed:", data.status, data.error_message || "");
      return null;
    }

    return mapGoogleComponentsToAddress(data.results[0]);
  } catch (error) {
    console.error("Error fetching address:", error);
    return null;
  }
};
