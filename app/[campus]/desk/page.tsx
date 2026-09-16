"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CampusShell } from "../_components/campus-shell";
import { formatTimeAgo } from "@/lib/time";
import type { ApiItem } from "../_components/types";

type DeskPageProps = {
  params: Promise<{ campus: string }>;
};

export default function DeskPage({ params }: DeskPageProps) {
  const { campus } = use(params);

  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "expired" | "desk">("all");

  const loadDeskItems = useCallback(
    async (authPin: string) => {
      setLoading(true);
      setPinError(null);
      try {
        const res = await fetch(`/api/${campus}/desk/items?pin=${encodeURIComponent(authPin)}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 401) {
            setIsAuthenticated(false);
            setPinError("Invalid security desk PIN. Please try again.");
            return;
          }
          throw new Error("Failed to load desk inventory");
        }

        const data = await res.json();
        setItems(data.items ?? []);
        setIsAuthenticated(true);
        // Persist PIN in sessionStorage for current browser session
        sessionStorage.setItem(`cf_desk_pin_${campus}`, authPin);
      } catch (err: unknown) {
        setPinError(err instanceof Error ? err.message : "Error connecting to desk");
      } finally {
        setLoading(false);
      }
    },
    [campus]
  );

  // Auto-authenticate if PIN is stored in session
  useEffect(() => {
    const savedPin = sessionStorage.getItem(`cf_desk_pin_${campus}`);
    if (savedPin) {
      setPin(savedPin);
      loadDeskItems(savedPin);
    }
  }, [campus, loadDeskItems]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    loadDeskItems(pin.trim());
  };

  const handleAction = async (itemId: string, action: "receive" | "return" | "dispose") => {
    try {
      const res = await fetch(`/api/${campus}/desk/items/${itemId}/${action}?pin=${encodeURIComponent(pin)}`, {
        method: "POST",
      });

      if (res.ok) {
        loadDeskItems(pin);
      }
    } catch {
      // Non-blocking
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  return (
    <CampusShell title="Block I Security Desk" subtitle="CHRIST · Bangalore Kengeri">
      <div className="mx-auto max-w-xl px-4 py-4 space-y-4">
        {!isAuthenticated ? (
          /* Staff PIN Access Gate */
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="mt-3 text-lg font-bold text-zinc-100">Campus Security Staff Portal</h2>
            <p className="mt-1 text-xs text-zinc-400">
              This section is reserved for campus security and facility staff to manage expired pins and turned-in physical belongings.
            </p>

            <form onSubmit={handleLogin} className="mt-6 max-w-xs mx-auto space-y-3">
              <div>
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter Desk PIN"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-center text-sm text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {pinError && <p className="text-xs text-rose-400">{pinError}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {loading ? "Checking PIN..." : "Access Desk Portal"}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Staff Inventory View */
          <div className="space-y-4">
            {/* Header info card */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Authorized Session
                </span>
                <p className="mt-0.5 text-xs text-zinc-400">Security & Reception Desk</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem(`cf_desk_pin_${campus}`);
                  setIsAuthenticated(false);
                  setPin("");
                }}
                className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Lock Desk
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(["all", "expired", "desk"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    filterStatus === status
                      ? "bg-emerald-500 text-zinc-950"
                      : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  {status === "all" ? `All (${items.length})` : status === "expired" ? "Expired Pins" : "Physically at Desk"}
                </button>
              ))}
            </div>

            {/* Inventory List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 text-center text-xs text-zinc-400">
                No items currently require desk intervention in this filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs space-y-3 shadow"
                  >
                    <div className="flex gap-3">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                        {item.photoPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.photoPath} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.2 text-[10px] font-semibold uppercase ${
                              item.status === "desk"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-zinc-700/40 text-zinc-300 border border-zinc-700"
                            }`}
                          >
                            {item.status === "desk" ? "Physically at Desk" : "Expired (Awaiting Intake)"}
                          </span>
                          <span className="text-[11px] text-zinc-400">{formatTimeAgo(item.createdAt)}</span>
                        </div>
                        <h4 className="mt-1 font-semibold text-sm text-zinc-100">{item.title}</h4>
                        <p className="text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{item.placeLabel || "Campus spot"}</span>
                        </p>
                      </div>
                    </div>

                    {item.note && (
                      <p className="rounded-lg bg-zinc-950 p-2 text-zinc-300 italic">
                        &ldquo;{item.note}&rdquo;
                      </p>
                    )}

                    {/* Desk Actions */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-800/80">
                      {item.status !== "desk" ? (
                        <button
                          type="button"
                          onClick={() => handleAction(item.id, "receive")}
                          className="flex-1 rounded-xl bg-amber-500 py-2 font-semibold text-zinc-950 hover:bg-amber-400"
                        >
                          Check In to Desk
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAction(item.id, "return")}
                          className="flex-1 rounded-xl bg-emerald-500 py-2 font-semibold text-zinc-950 hover:bg-emerald-400"
                        >
                          Return to Student
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAction(item.id, "dispose")}
                        className="rounded-xl border border-zinc-700 px-3 py-2 text-zinc-400 hover:bg-zinc-800"
                      >
                        Archive / Dispose
                      </button>

                      <Link
                        href={`/${campus}/item/${item.id}`}
                        className="rounded-xl border border-zinc-700 px-3 py-2 text-zinc-300 hover:bg-zinc-800 flex items-center"
                      >
                        View Pin
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </CampusShell>
  );
}
