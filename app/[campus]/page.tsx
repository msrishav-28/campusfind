import { notFound } from "next/navigation";
import { kengeriCampus } from "@/lib/kengeri";
import { KengeriMap } from "./_components/kengeri-map";

type CampusPageProps = {
  params: Promise<{
    campus: string;
  }>;
};

export default async function CampusPage({ params }: CampusPageProps) {
  const { campus } = await params;

  if (campus !== "kengeri") {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Map · List · + · Mine · Help</p>
        <h1 className="mt-1 text-base font-semibold">{kengeriCampus.name}</h1>
      </header>

      <section className="relative flex-1">
        <KengeriMap centroid={kengeriCampus.centroid} places={kengeriCampus.places} />
      </section>
    </main>
  );
}
