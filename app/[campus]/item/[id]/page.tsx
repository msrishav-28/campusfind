import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getItem } from "@/lib/store";
import { isCampusApproved } from "@/lib/campus";
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
  if (!isCampusApproved(campus)) {
    return { title: "CampusFind" };
  }

  const item = await getItem(campus, id);
  if (!item) {
    return { title: "Item Not Found · CampusFind" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://campusfind.app";
  const typePrefix = item.type === "lost" ? "Lost" : "Found";
  const place = item.placeLabel || "Campus";
  const title = `${typePrefix}: ${item.title} · ${place} · CampusFind`;
  const description = `Lost something on campus? Pin it on the map instead of the group. ${item.title} reported ${typePrefix.toLowerCase()} at ${place}.`;
  const canonicalUrl = `${baseUrl}/${campus}/item/${item.id}`;

  const imageUrl = item.photoPath
    ? item.photoPath.startsWith("http")
      ? item.photoPath
      : `${baseUrl}${item.photoPath.startsWith("/") ? "" : "/"}${item.photoPath}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: item.title }] : [],
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { campus, id } = await params;

  if (!isCampusApproved(campus)) {
    notFound();
  }

  const item = await getItem(campus, id);
  if (!item) {
    notFound();
  }

  return (
    <CampusShell
      title={item.title}
      subtitle={`${item.type === "lost" ? "Lost" : "Found"} · ${item.placeLabel || "Campus"}`}
    >
      <ItemDetailView campus={campus} initialItem={item} />
    </CampusShell>
  );
}
