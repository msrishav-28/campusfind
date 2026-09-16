"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CampusShell } from "../_components/campus-shell";
import { haversineMeters } from "@/lib/location";
import { formatTimeAgo } from "@/lib/time";
import type { ApiItem } from "../_components/types";

type ListPageProps = {
  params: Promise<{ campus: string }>;
};

type FilterType = "all" | "lost" | "found" | "near";

export default function ListPage({ params }: ListPageProps) {
  const { campus } = use(params);

  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "nearest">("newest");
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Request geolocation for distance sorting & "Near me"
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeviceCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setDeviceCoords(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 }
    );
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (activeFilter === "lost" || activeFilter === "found") {
        query.set("type", activeFilter);
      }
      if (activeFilter === "near" && deviceCoords) {
        query.set("near", "1");
        query.set("lat", String(deviceCoords.lat));
        query.set("lng", String(deviceCoords.lng));
      }
      if (searchQuery.trim()) {
        query.set("q", searchQuery.trim());
      }

      const res = await fetch(`/api/${campus}/items?${query.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, campus, deviceCoords, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  // Compute sorted items
  const sortedItems = useMemo(() => {
    const list = [...items];
    if (sortBy === "nearest" && deviceCoords) {
      list.sort((a, b) => {
        const distA = haversineMeters(deviceCoords.lat, deviceCoords.lng, a.lat, a.lng);
        const distB = haversineMeters(deviceCoords.lat, deviceCoords.lng, b.lat, b.lng);
        return distA - distB;
      });
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [items, sortBy, deviceCoords]);

  return (
    <CampusShell title="Lost & Found Feed" subtitle="CHRIST · Bangalore Kengeri">
      <div className="mx-auto max-w-xl px-4 py-4">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, places, categories..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <svg
            className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter chips & Sort toggle */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(["all", "lost", "found", "near"] as FilterType[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activeFilter === filter
                    ? "bg-emerald-500 text-zinc-950"
                    : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {filter === "near" ? "Near Me" : filter[0].toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <span>Sort:</span>
            <button
              type="button"
              onClick={() => setSortBy("newest")}
              className={`rounded px-1.5 py-0.5 ${sortBy === "newest" ? "font-semibold text-emerald-400" : "hover:text-zinc-200"}`}
            >
              Newest
            </button>
            <span>·</span>
            <button
              type="button"
              disabled={!deviceCoords}
              onClick={() => setSortBy("nearest")}
              className={`rounded px-1.5 py-0.5 ${
                !deviceCoords
                  ? "cursor-not-allowed opacity-40"
                  : sortBy === "nearest"
                  ? "font-semibold text-emerald-400"
                  : "hover:text-zinc-200"
              }`}
            >
              Nearest
            </button>
          </div>
        </div>

        {/* List items */}
        <div className="mt-4 space-y-2.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="mt-3 text-xs">Loading campus posts...</p>
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-zinc-200">No items found</h3>
              <p className="mt-1 text-xs text-zinc-400">
                {searchQuery
                  ? `No pins match "${searchQuery}". Try a broader term.`
                  : "No active pins in this category right now."}
              </p>
              <Link
                href={`/${campus}/report`}
                className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
              >
                Pin a new item
              </Link>
            </div>
          ) : (
            sortedItems.map((item) => {
              const distance =
                deviceCoords && haversineMeters(deviceCoords.lat, deviceCoords.lng, item.lat, item.lng);

              return (
                <Link
                  key={item.id}
                  href={`/${campus}/item/${item.id}`}
                  className="flex items-center gap-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-3 transition hover:border-zinc-700 hover:bg-zinc-900"
                >
                  {/* 72px Thumbnail */}
                  <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                    {item.photoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photoPath} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                        <span className={`h-4 w-4 rounded-full ${item.type === "lost" ? "bg-rose-500 ring-4 ring-rose-500/20" : "bg-emerald-500 ring-4 ring-emerald-500/20"}`} />
                      </div>
                    )}
                  </div>

                  {/* Item metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          item.type === "lost"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-[11px] text-zinc-400">{formatTimeAgo(item.createdAt)}</span>
                      {distance !== null && distance !== undefined && (
                        <span className="text-[11px] text-zinc-400">· ~{Math.round(distance)}m away</span>
                      )}
                    </div>

                    <h3 className="mt-1 truncate text-sm font-semibold text-zinc-100">{item.title}</h3>

                    <p className="mt-0.5 truncate text-xs text-zinc-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{item.placeLabel || "Campus spot"}</span>
                      {item.floor !== null ? <span>(Floor {item.floor})</span> : null}
                      {item.accuracyM !== null ? <span>· ±{Math.round(item.accuracyM)}m</span> : null}
                    </p>

                    {item.note && <p className="mt-0.5 truncate text-[11px] text-zinc-400">&ldquo;{item.note}&rdquo;</p>}
                  </div>

                  <div className="flex-shrink-0 text-zinc-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </CampusShell>
  );
}
