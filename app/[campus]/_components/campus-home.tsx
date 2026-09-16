"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KengeriMap } from "./kengeri-map";
import type { ApiItem } from "./types";

type CampusHomeProps = {
  campus: string;
  centroid: { lat: number; lng: number };
};

type FilterType = "all" | "lost" | "found" | "near";

const FILTERS: FilterType[] = ["all", "lost", "found", "near"];

export function CampusHome({ campus, centroid }: CampusHomeProps) {
  const [items, setItems] = useState<ApiItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<ApiItem | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);

  const loadItems = useCallback(async () => {
    const query = new URLSearchParams();
    query.set("status", "open");
    if (activeFilter === "lost" || activeFilter === "found") {
      query.set("type", activeFilter);
    }

    if (activeFilter === "near" && deviceLocation) {
      query.set("near", "1");
      query.set("lat", String(deviceLocation.lat));
      query.set("lng", String(deviceLocation.lng));
    }

    const response = await fetch(`/api/${campus}/items?${query.toString()}`, { cache: "no-store" });
    const json = await response.json();
    setItems(json.items ?? []);
  }, [activeFilter, campus, deviceLocation]);

  useEffect(() => {
    fetch("/api/session", { cache: "no-store" }).catch(() => null);

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setDeviceLocation(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 }
    );
  }, []);

  useEffect(() => {
    loadItems().catch(() => null);
  }, [loadItems]);

  const label = useMemo(() => {
    switch (activeFilter) {
      case "lost":
        return "Lost";
      case "found":
        return "Found";
      case "near":
        return "Near me";
      default:
        return "All";
    }
  }, [activeFilter]);

  return (
    <div>
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-3 py-2 text-sm ${activeFilter === filter ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-200"}`}
            >
              {filter === "near" ? "Near me" : `${filter[0].toUpperCase()}${filter.slice(1)}`}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-400">Showing {label.toLowerCase()} pins · Tap a pin to view details.</p>
      </div>

      <KengeriMap centroid={centroid} items={items} deviceLocation={deviceLocation} onSelect={setSelected} />

      {selected ? (
        <div className="fixed inset-x-0 bottom-24 z-20 mx-auto w-[94%] max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            {selected.photoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.photoPath}
                alt={selected.title}
                className="h-16 w-16 flex-shrink-0 rounded-2xl border border-zinc-800 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-2xl">
                {selected.type === "lost" ? "🔴" : "🟢"}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  selected.type === "lost"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {selected.type}
              </span>
              <h2 className="mt-1 truncate text-base font-semibold text-zinc-100">{selected.title}</h2>
              <p className="truncate text-xs text-zinc-400">
                📍 {selected.placeLabel ?? "Campus spot"}
                {selected.accuracyM !== null ? ` · ±${Math.round(selected.accuracyM)} m` : ""}
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex gap-2 border-t border-zinc-800/80 pt-3">
            <Link
              href={`/${campus}/item/${selected.id}`}
              className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-center text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              View Full Details & Claim
            </Link>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-xs text-zinc-400 hover:bg-zinc-800"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
