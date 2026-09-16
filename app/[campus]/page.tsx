import { notFound } from "next/navigation";
import { getCampus } from "@/lib/campus";
import { CampusShell } from "./_components/campus-shell";
import { CampusHome } from "./_components/campus-home";

type CampusPageProps = {
  params: Promise<{
    campus: string;
  }>;
};

export default async function CampusPage({ params }: CampusPageProps) {
  const { campus } = await params;

  const campusData = await getCampus(campus);
  if (!campusData) {
    notFound();
  }

  return (
    <CampusShell title="CampusFind" subtitle={campusData.name}>
      <CampusHome campus={campus} centroid={campusData.centroid} />
    </CampusShell>
  );
}
