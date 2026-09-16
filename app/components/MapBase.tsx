"use client";

import { useMemo, useRef, useState } from "react";
import { Autocomplete, GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_LOADER_OPTIONS } from "@/lib/googleMaps";

type Props = {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultPosition?: [number, number];
};

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

export default function MapPicker({ onLocationSelect, defaultPosition }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    defaultPosition ? { lat: defaultPosition[0], lng: defaultPosition[1] } : null,
  );
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS);

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
      mapRef.current.setZoom(16);
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
      () => {
        alert("Unable to fetch location");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const handlePlaceChanged = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    const location = place.geometry?.location;
    if (!location) return;
    updateLocation(location.lat(), location.lng());
    setSearchValue(place.formatted_address || place.name || "");
  };

  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 px-6 text-center dark:bg-zinc-900">
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Add <code className="font-semibold">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> and restart the app.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 px-6 text-center dark:bg-zinc-900">
        <p className="text-sm text-red-600">Map failed to load. Check Places API + key restrictions.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
        Loading map...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {loading ? (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/95 backdrop-blur-sm dark:bg-zinc-950/80">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">Fetching your location...</p>
          </div>
        </div>
      ) : null}

      <div className="absolute left-3 right-[8.5rem] top-3 z-[2000] sm:left-4 sm:right-40 sm:top-4">
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
            placeholder="Search area, landmark, or address"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-md outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </Autocomplete>
      </div>

      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={loading}
        className="absolute right-3 top-3 z-[2000] h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-md transition hover:bg-slate-50 disabled:text-slate-400 sm:right-4 sm:top-4 sm:px-4 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        {loading ? "Locating..." : "My location"}
      </button>

      <GoogleMap
        center={mapCenter}
        zoom={effectivePosition ? 16 : 5}
        mapContainerClassName="h-full w-full"
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
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
        {effectivePosition ? (
          <MarkerF
            position={effectivePosition}
            draggable
            onDragEnd={(e) => {
              const lat = e.latLng?.lat();
              const lng = e.latLng?.lng();
              if (typeof lat === "number" && typeof lng === "number") {
                updateLocation(lat, lng);
              }
            }}
          />
        ) : null}
      </GoogleMap>
    </div>
  );
}
