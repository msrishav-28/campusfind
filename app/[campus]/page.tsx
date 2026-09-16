import { notFound } from "next/navigation";
import { kengeriCampus } from "@/lib/kengeri";
import { CampusShell } from "./_components/campus-shell";
import { CampusHome } from "./_components/campus-home";

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
    <CampusShell title="CampusFind" subtitle="CHRIST (Deemed to be University) · Kengeri">
      <CampusHome campus={campus} centroid={kengeriCampus.centroid} />
    </CampusShell>
  );
}
