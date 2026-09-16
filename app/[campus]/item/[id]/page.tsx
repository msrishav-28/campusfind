import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getItem } from "@/lib/store";
import { CampusShell } from "../../_components/campus-shell";
import { ItemDetailView } from "./item-detail-view";

type ItemPageProps = {
  params: Promise<{
    campus: string;
    id: string;
  }>;
};

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const { campus, id } = await params;
  if (campus !== "kengeri") {
    return { title: "CampusFind" };
  }

  const item = await getItem(campus, id);
  if (!item) {
    return { title: "Item Not Found · CampusFind" };
  }

  const typePrefix = item.type === "lost" ? "Lost" : "Found";
  const place = item.placeLabel || "Kengeri Campus";
  const title = `${typePrefix}: ${item.title} · ${place} · CampusFind`;
  const description = `Reported ${typePrefix.toLowerCase()} at ${place} on CHRIST Kengeri campus. Tap to view pin or claim.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: item.photoPath ? [item.photoPath] : [],
      url: `https://campusfind.app/kengeri/item/${item.id}`,
    },
    twitter: {
      card: item.photoPath ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { campus, id } = await params;

  if (campus !== "kengeri") {
    notFound();
  }

  const item = await getItem(campus, id);
  if (!item) {
    notFound();
  }

  return (
    <CampusShell
      title={item.title}
      subtitle={`${item.type === "lost" ? "Lost" : "Found"} · ${item.placeLabel || "Kengeri"}`}
    >
      <ItemDetailView campus={campus} initialItem={item} />
    </CampusShell>
  );
}
