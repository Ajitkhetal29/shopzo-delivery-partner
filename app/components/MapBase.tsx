"use client";

import { useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  GoogleMap,
  MarkerF,
  useJsApiLoader,
} from "@react-google-maps/api";

type Props = {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultPosition?: [number, number];
};

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const MAP_LIBRARIES: ("places")[] = ["places"];

export default function MapPicker({ onLocationSelect, defaultPosition }: Props) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    defaultPosition ? { lat: defaultPosition[0], lng: defaultPosition[1] } : null,
  );
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: MAP_LIBRARIES,
  });

  const effectivePosition = useMemo(() => {
    if (position) return position;
    if (defaultPosition) return { lat: defaultPosition[0], lng: defaultPosition[1] };
    return null;
  }, [position, defaultPosition]);

  const mapCenter = useMemo(() => effectivePosition || DEFAULT_CENTER, [effectivePosition]);

  const updateLocation = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    onLocationSelect(lat, lng);
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(15);
    }
  };

  const handleUseMyLocation = () => {
    setLoading(true);

    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        alert("Unable to fetch location");
        setLoading(false);
      },
    );
  };

  const handlePlaceChanged = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    const location = place.geometry?.location;
    if (!location) return;
    const lat = location.lat();
    const lng = location.lng();
    updateLocation(lat, lng);
    setSearchValue(place.formatted_address || place.name || "");
  };

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        Loading map...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-md">
      {loading ? (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center rounded-md bg-white/95 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
            <p className="text-sm font-medium text-gray-700">Fetching your location...</p>
          </div>
        </div>
      ) : null}
      <div className="absolute left-4 right-32 top-4 z-[2000] max-w-xl">
        <Autocomplete
          onLoad={(autocomplete) => {
            autocompleteRef.current = autocomplete;
          }}
          onPlaceChanged={handlePlaceChanged}
        >
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search location"
            className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-md outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
        </Autocomplete>
      </div>

      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={loading}
        className="absolute right-4 top-4 z-[2000] rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-md transition-all hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
      >
        {loading ? "Loading..." : "Use my location"}
      </button>

      <GoogleMap
        center={mapCenter}
        zoom={effectivePosition ? 15 : 5}
        mapContainerClassName="h-full w-full"
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        onClick={(e) => {
          const lat = e.latLng?.lat();
          const lng = e.latLng?.lng();
          if (typeof lat === "number" && typeof lng === "number") {
            updateLocation(lat, lng);
          }
        }}
      >
        {effectivePosition ? <MarkerF position={effectivePosition} /> : null}
      </GoogleMap>
    </div>
  );
}
