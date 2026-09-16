import { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";

type CampusShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function CampusShell({ title, subtitle, children }: CampusShellProps) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        {subtitle ? <p className="text-xs text-zinc-400">{subtitle}</p> : null}
        <h1 className="text-base font-semibold">{title}</h1>
      </header>
      <section className="pb-28">{children}</section>
      <BottomNav />
    </main>
  );
}
