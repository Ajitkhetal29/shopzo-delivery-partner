"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_LOADER_OPTIONS } from "@/lib/googleMaps";

export default function GoogleMapsLoader() {
  useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS);
  return null;
}
