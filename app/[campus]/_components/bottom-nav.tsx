"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Map", href: "/kengeri" },
  { label: "List", href: "/kengeri/list" },
  { label: "+", href: "/kengeri/report" },
  { label: "Mine", href: "/kengeri/me" },
  { label: "Help", href: "/about" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-800 bg-zinc-950/95 px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur">
      <ul className="mx-auto flex max-w-xl items-center justify-between">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                className={`block rounded-xl px-3 py-3 text-center text-sm font-medium ${active ? "text-emerald-400" : "text-zinc-300"}`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
