"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, { LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type KengeriMapProps = {
  centroid: {
    lat: number;
    lng: number;
  };
  places: Place[];
};

const mapStyle = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
} as const;

export function KengeriMap({ centroid, places }: KengeriMapProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const bounds = useMemo<LngLatBoundsLike>(() => {
    const allPoints = places.map((place) => [place.lng, place.lat] as [number, number]);
    return allPoints.length > 1 ? allPoints : [[centroid.lng, centroid.lat], [centroid.lng, centroid.lat]];
  }, [centroid.lat, centroid.lng, places]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [centroid.lng, centroid.lat],
      zoom: 16,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      map.fitBounds(bounds, { padding: 36, maxZoom: 17 });

      places.forEach((place) => {
        const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false }).setHTML(
          `<strong>${place.name}</strong>`
        );

        const marker = new maplibregl.Marker({ color: "#16a34a", scale: 0.9 })
          .setLngLat([place.lng, place.lat])
          .setPopup(popup)
          .addTo(map);

        marker.getElement().addEventListener("mouseenter", () => popup.addTo(map));
        marker.getElement().addEventListener("mouseleave", () => popup.remove());
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [bounds, centroid.lat, centroid.lng, places]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}
