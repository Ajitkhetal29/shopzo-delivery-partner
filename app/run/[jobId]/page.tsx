"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { DirectionsRenderer, GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { API_ENDPOINTS } from "@/lib/api";
import { card } from "@/lib/delivery-ui";
import { GOOGLE_MAPS_LOADER_OPTIONS } from "@/lib/googleMaps";

type Point = { lat: number; lng: number };

type RunJob = {
  id: string;
  status: string;
  hubStatus: string | null;
  pickupName: string | null;
  pickupArea: string | null;
  dropoffBuilding: string | null;
  dropoffArea: string | null;
  tripKm: number | null;
  payout: number;
  pickupLocation: Point | null;
  dropoffLocation: Point | null;
  order: {
    id: string;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string | null;
    customerName: string | null;
    customerPhone: string | null;
  } | null;
};

const NEAR_M = 100;

const metersBetween = (a: Point, b: Point) => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export default function RunJobPage() {
  const params = useParams<{ jobId: string }>();
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS);

  const [job, setJob] = useState<RunJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [atDrop, setAtDrop] = useState(false);
  const [here, setHere] = useState<Point | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const routeKey = useRef("");

  const load = useCallback(async () => {
    if (!params.jobId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_ENDPOINTS.ACCEPT_JOB}/${params.jobId}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        const next = res.data.job as RunJob;
        setJob(next);
        if (next.status === "in_transit") setNavigating(true);
      } else toast.error(res.data?.message || "Could not load job");
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not load job"
      );
    } finally {
      setLoading(false);
    }
  }, [params.jobId]);

  useEffect(() => {
    load();
  }, [load]);

  // Live GPS while navigating
  useEffect(() => {
    if (!navigating) return;
    if (!navigator.geolocation) {
      toast.error("Location not supported");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast.error("Could not read GPS"),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [navigating]);

  // Refresh while waiting for ship
  useEffect(() => {
    if (job?.status !== "at_pickup" || job.hubStatus === "shipped") return;
    const id = window.setInterval(load, 8000);
    return () => window.clearInterval(id);
  }, [job?.status, job?.hubStatus, load]);

  const destination = useMemo(() => {
    if (!job) return null;
    if (job.status === "initiated") return job.pickupLocation;
    if (job.status === "in_transit") return job.dropoffLocation;
    return null;
  }, [job]);

  // Draw / refresh route
  useEffect(() => {
    if (!isLoaded || !here || !destination || !window.google?.maps) return;
    const key = `${here.lat.toFixed(3)},${here.lng.toFixed(3)}>${destination.lat},${destination.lng}`;
    if (key === routeKey.current) return;
    routeKey.current = key;

    new google.maps.DirectionsService().route(
      { origin: here, destination, travelMode: google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status === "OK" && result) setDirections(result);
      }
    );
  }, [isLoaded, here, destination]);

  useEffect(() => {
    if (here && mapRef.current) mapRef.current.panTo(here);
  }, [here]);

  const distanceM = here && destination ? Math.round(metersBetween(here, destination)) : null;
  const near = distanceM != null && distanceM <= NEAR_M;

  const markPickup = async () => {
    if (!job || !here) return;
    setBusy(true);
    try {
      const res = await axios.post(
        `${API_ENDPOINTS.ACCEPT_JOB}/${job.id}/arrive`,
        { lat: here.lat, lng: here.lng },
        { withCredentials: true }
      );
      if (res.data?.success) {
        toast.success("Marked at pickup");
        setJob(res.data.job);
        setNavigating(false);
        setDirections(null);
        routeKey.current = "";
      } else toast.error(res.data?.message || "Could not mark arrived");
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not mark arrived"
      );
    } finally {
      setBusy(false);
    }
  };

  const headToCustomer = async () => {
    if (!job) return;
    setBusy(true);
    try {
      const res = await axios.post(
        `${API_ENDPOINTS.ACCEPT_JOB}/${job.id}/transit`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        toast.success("Heading to customer");
        setJob(res.data.job);
        setNavigating(true);
        setDirections(null);
        routeKey.current = "";
      } else toast.error(res.data?.message || "Could not start");
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not start"
      );
    } finally {
      setBusy(false);
    }
  };

  const collectCod = async () => {
    if (!job) return;
    setBusy(true);
    try {
      const res = await axios.post(
        `${API_ENDPOINTS.ACCEPT_JOB}/${job.id}/collect-cod`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        toast.success("COD collected");
        setJob(res.data.job);
      } else toast.error(res.data?.message || "Could not collect COD");
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not collect COD"
      );
    } finally {
      setBusy(false);
    }
  };

  const markDelivered = async () => {
    if (!job || !here) return;
    setBusy(true);
    try {
      const res = await axios.post(
        `${API_ENDPOINTS.ACCEPT_JOB}/${job.id}/complete`,
        { lat: here.lat, lng: here.lng },
        { withCredentials: true }
      );
      if (res.data?.success) {
        toast.success("Delivery completed");
        setJob(res.data.job);
        setNavigating(false);
        setAtDrop(false);
      } else toast.error(res.data?.message || "Could not complete");
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not complete"
      );
    } finally {
      setBusy(false);
    }
  };

  const pickupTitle = job?.pickupName || job?.pickupArea || "Pickup";
  const dropTitle = job?.dropoffBuilding || job?.dropoffArea || "Customer";

  if (loading) {
    return (
      <div className={`${card} px-6 py-16 text-center text-sm text-shop-muted`}>Loading run…</div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <Link href="/accepted" className="text-sm font-semibold text-shop-accent hover:underline">
          ← Accepted
        </Link>
        <div className={`${card} px-6 py-16 text-center text-sm text-shop-muted`}>Job not found.</div>
      </div>
    );
  }

  // Step 1 screen — before map
  if (job.status === "initiated" && !navigating) {
    return (
      <div className="space-y-6">
        <Link href="/accepted" className="text-sm font-semibold text-shop-accent hover:underline">
          ← Accepted
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Head to pickup</h1>
          <p className="mt-1 text-sm text-shop-muted">
            {pickupTitle} · then {dropTitle}
            {job.tripKm != null ? ` · ${job.tripKm} km` : ""} · ₹{job.payout}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNavigating(true)}
          className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Head to pickup
        </button>
      </div>
    );
  }

  if (job.status === "completed") {
    return (
      <div className="space-y-6">
        <Link href="/accepted" className="text-sm font-semibold text-shop-accent hover:underline">
          ← Accepted
        </Link>
        <div className={`${card} space-y-3 p-6 text-center`}>
          <h1 className="text-2xl font-semibold tracking-tight">Delivered</h1>
          <p className="text-sm text-shop-muted">{dropTitle}</p>
          <Link
            href="/accepted"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Back to accepted
          </Link>
        </div>
      </div>
    );
  }

  // Waiting for ship / start customer leg
  if (job.status === "at_pickup") {
    return (
      <div className="space-y-6">
        <Link href="/accepted" className="text-sm font-semibold text-shop-accent hover:underline">
          ← Accepted
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">At pickup</h1>
          <p className="mt-1 text-sm text-shop-muted">{pickupTitle}</p>
        </div>
        {job.hubStatus === "shipped" ? (
          <button
            type="button"
            disabled={busy}
            onClick={headToCustomer}
            className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? "Starting…" : "Head to customer"}
          </button>
        ) : (
          <div className={`${card} p-5 text-sm text-shop-muted`}>
            Waiting for vendor / warehouse to mark shipped.
            <button
              type="button"
              onClick={load}
              className="mt-3 block text-sm font-semibold text-shop-accent hover:underline"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    );
  }

  const order = job.order;
  const isCod = order?.paymentMethod === "cod";
  const paymentPaid = order?.paymentStatus === "paid";
  const canDeliver = !isCod || paymentPaid;

  // Drop handoff — after rider is near customer
  if (job.status === "in_transit" && atDrop) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setAtDrop(false)}
          className="text-sm font-semibold text-shop-accent hover:underline"
        >
          ← Back to map
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">At customer</h1>
          <p className="mt-1 text-sm text-shop-muted">{dropTitle}</p>
        </div>

        <div className={`${card} space-y-2 p-5`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-shop-muted">Order</p>
          <p className="text-sm font-semibold text-foreground">
            #{order?.id ? order.id.slice(-8).toUpperCase() : "—"}
          </p>
          <p className="text-sm text-foreground">
            {order?.customerName || "Customer"}
            {order?.customerPhone ? ` · ${order.customerPhone}` : ""}
          </p>
          <p className="text-sm text-shop-muted">
            ₹{order?.totalAmount ?? 0} · {isCod ? "COD" : "Online"} ·{" "}
            {paymentPaid ? "Paid" : "Payment pending"}
          </p>
        </div>

        <button
          type="button"
          disabled
          className="h-11 w-full rounded-xl border border-shop-border text-sm font-semibold text-shop-muted"
        >
          Notify customer (soon)
        </button>

        {isCod && !paymentPaid ? (
          <button
            type="button"
            disabled={busy}
            onClick={collectCod}
            className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? "Saving…" : `Collect COD · ₹${order?.totalAmount ?? 0}`}
          </button>
        ) : null}

        {isCod && paymentPaid ? (
          <p className="text-center text-sm text-emerald-700 dark:text-emerald-300">COD collected</p>
        ) : null}

        <button
          type="button"
          disabled={!canDeliver || busy || !here || !near}
          onClick={markDelivered}
          className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {busy
            ? "Updating…"
            : !canDeliver
              ? "Collect COD first"
              : !near
                ? "Stay within 100 m to deliver"
                : "Mark delivered"}
        </button>
      </div>
    );
  }

  // Map nav (pickup or customer)
  return (
    <div className="space-y-4 pb-28">
      <div className="flex items-center justify-between gap-3">
        <Link href="/accepted" className="text-sm font-semibold text-shop-accent hover:underline">
          ← Accepted
        </Link>
        {here && destination ? (
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${here.lat},${here.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-shop-accent hover:underline"
          >
            Open in Maps
          </a>
        ) : null}
      </div>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {job.status === "initiated" ? `To pickup · ${pickupTitle}` : `To customer · ${dropTitle}`}
        </h1>
        <p className="mt-1 text-sm text-shop-muted">
          {distanceM != null
            ? `${distanceM} m away · unlock under ${NEAR_M} m`
            : "Getting GPS…"}
        </p>
      </div>

      {isLoaded && destination ? (
        <div className="overflow-hidden rounded-2xl border border-shop-border">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "55vh" }}
            center={here || destination}
            zoom={15}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
            }}
          >
            {here ? (
              <MarkerF
                position={here}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#059669",
                  fillOpacity: 1,
                  strokeColor: "#fff",
                  strokeWeight: 2,
                }}
              />
            ) : null}
            <MarkerF position={destination} />
            {directions ? (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: { strokeColor: "#059669", strokeWeight: 5 },
                }}
              />
            ) : null}
          </GoogleMap>
        </div>
      ) : (
        <div className={`${card} px-6 py-16 text-center text-sm text-shop-muted`}>Loading map…</div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-shop-border bg-shop-surface/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-6xl">
          {job.status === "initiated" ? (
            <button
              type="button"
              disabled={!near || busy || !here}
              onClick={markPickup}
              className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {busy
                ? "Updating…"
                : near
                  ? "Mark reached pickup"
                  : distanceM != null
                    ? `Get within ${NEAR_M} m (${distanceM} m)`
                    : "Waiting for GPS…"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!near || !here}
              onClick={() => setAtDrop(true)}
              className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {near
                ? "Open delivery"
                : distanceM != null
                  ? `Get within ${NEAR_M} m (${distanceM} m)`
                  : "Waiting for GPS…"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
