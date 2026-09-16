import kengeriRaw from "@/data/kengeri/places.json";

export type KengeriPlace = {
  id: string;
  name: string;
  kind: string;
  aliases?: string[];
  lat: number;
  lng: number;
  floors: number[];
  parent_id?: string;
};

export type KengeriCampus = {
  campus: string;
  name: string;
  plus_code: string;
  centroid: {
    lat: number;
    lng: number;
  };
  fence_m: number;
  note?: string;
  places: KengeriPlace[];
};

export const kengeriCampus = kengeriRaw as unknown as KengeriCampus;
