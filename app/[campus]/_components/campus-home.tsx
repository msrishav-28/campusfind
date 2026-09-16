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
        <div className="fixed inset-x-0 bottom-20 z-20 mx-auto w-[94%] max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl">
          <p className="text-xs uppercase tracking-wide text-zinc-400">{selected.type === "lost" ? "Lost" : "Found"}</p>
          <h2 className="mt-1 text-base font-semibold">{selected.title}</h2>
          <p className="mt-1 text-sm text-zinc-300">
            {selected.placeLabel ?? "Unnamed campus spot"}
            {selected.accuracyM !== null ? ` · ±${Math.round(selected.accuracyM)} m` : ""}
          </p>
          <div className="mt-3 flex gap-2">
            <Link href={`/kengeri/item/${selected.id}`} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-zinc-950">
              View
            </Link>
            <button type="button" onClick={() => setSelected(null)} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
