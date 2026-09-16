"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { getAddress } from "@/services/address";
import type { Address } from "@/store/types/address";

const MapBase = dynamic(() => import("@/app/components/MapBase"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
      Loading map...
    </div>
  ),
});

export type PickedLocation = {
  lat: number;
  lng: number;
  address: Address;
};

type Props = {
  defaultPosition?: { lat: number; lng: number } | null;
  onConfirm: (result: PickedLocation) => void;
  onClose: () => void;
};

const emptyAddress: Address = {
  formatted: "",
  line1: "",
  city: "",
  state: "",
  pincode: "",
};

export default function AddressLocationPicker({ defaultPosition, onConfirm, onClose }: Props) {
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ lat: number; lng: number } | null>(defaultPosition || null);
  const [previewAddress, setPreviewAddress] = useState<Address | null>(null);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setPreview({ lat, lng });
    setError("");
    setPreviewAddress(null);
    setIsLoadingAddress(true);

    try {
      const addressData = await getAddress({ lat, lng });
      if (!addressData) {
        setError("Could not reverse-geocode this pin. You can still confirm and edit fields.");
        setPreviewAddress({ ...emptyAddress });
        return;
      }
      setPreviewAddress(addressData);
    } catch {
      setError("Could not reverse-geocode this pin. You can still confirm and edit fields.");
      setPreviewAddress({ ...emptyAddress });
    } finally {
      setIsLoadingAddress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:h-[82dvh] sm:rounded-[1.75rem]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/10 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Choose location
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Search or drop a pin</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              Search, tap the map, drag the marker, then confirm. Address fields fill from reverse geocode.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/5"
          >
            Close
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <MapBase
            defaultPosition={defaultPosition ? [defaultPosition.lat, defaultPosition.lng] : undefined}
            onLocationSelect={handleLocationSelect}
          />
          {isLoadingAddress ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-sm dark:bg-zinc-950/75">
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm dark:border-white/10 dark:bg-zinc-900">
                <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                <p className="text-sm font-semibold">Fetching address details...</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-3.5 dark:border-white/10 dark:bg-zinc-950 sm:px-6">
          {error ? <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p> : null}
          {!error && previewAddress?.formatted ? (
            <p className="line-clamp-2 text-sm text-slate-800 dark:text-zinc-200">{previewAddress.formatted}</p>
          ) : null}
          {preview ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-zinc-500">
                Pin: {preview.lat.toFixed(6)}, {preview.lng.toFixed(6)}
              </p>
              <button
                type="button"
                disabled={!preview || isLoadingAddress}
                onClick={() => {
                  if (!preview) return;
                  onConfirm({
                    lat: preview.lat,
                    lng: preview.lng,
                    address: previewAddress || emptyAddress,
                  });
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                Use this location
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Search or tap the map to drop a pin.</p>
          )}
        </div>
      </div>
    </div>
  );
}
