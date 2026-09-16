"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/90 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 backdrop-blur-md">
      <div className="mx-auto flex max-w-xl items-center justify-around px-2">
        {/* Map */}
        <Link
          href="/kengeri"
          className={`flex min-h-[44px] min-w-[48px] flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-medium transition ${
            pathname === "/kengeri" ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={pathname === "/kengeri" ? 2.2 : 1.8}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span className="mt-0.5">Map</span>
        </Link>

        {/* List */}
        <Link
          href="/kengeri/list"
          className={`flex min-h-[44px] min-w-[48px] flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-medium transition ${
            pathname === "/kengeri/list" ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={pathname === "/kengeri/list" ? 2.2 : 1.8}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <span className="mt-0.5">List</span>
        </Link>

        {/* Center + Action Button */}
        <Link
          href="/kengeri/report"
          aria-label="Pin an item"
          className="flex flex-col items-center justify-center px-1"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/25 transition active:scale-95 hover:bg-emerald-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="mt-0.5 text-[10px] font-semibold text-emerald-400">Pin</span>
        </Link>

        {/* Mine */}
        <Link
          href="/kengeri/me"
          className={`flex min-h-[44px] min-w-[48px] flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-medium transition ${
            pathname === "/kengeri/me" ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={pathname === "/kengeri/me" ? 2.2 : 1.8}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="mt-0.5">Mine</span>
        </Link>

        {/* Help */}
        <Link
          href="/about"
          className={`flex min-h-[44px] min-w-[48px] flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-medium transition ${
            pathname === "/about" ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={pathname === "/about" ? 2.2 : 1.8}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="mt-0.5">Help</span>
        </Link>
      </div>
    </nav>
  );
}
