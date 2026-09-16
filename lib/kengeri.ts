import kengeriRaw from "@/data/kengeri/places.json";

type KengeriPlace = {
  id: string;
  name: string;
  kind: string;
  lat: number;
  lng: number;
};

type KengeriCampus = {
  campus: string;
  name: string;
  centroid: {
    lat: number;
    lng: number;
  };
  places: KengeriPlace[];
};

export const kengeriCampus = kengeriRaw as KengeriCampus;
