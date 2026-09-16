"use client";

import { useEffect, useMemo, useRef } from "react";
import { AttributionControl, LngLatBounds, Map, Marker, NavigationControl } from "maplibre-gl";
import type { LngLatBoundsLike, StyleSpecification } from "maplibre-gl";
import type { ApiItem } from "./types";
import "maplibre-gl/dist/maplibre-gl.css";

type KengeriMapProps = {
  centroid: {
    lat: number;
    lng: number;
  };
  items: ApiItem[];
  deviceLocation: { lat: number; lng: number } | null;
  onSelect: (item: ApiItem) => void;
};

const mapStyle: StyleSpecification = {
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
};

export function KengeriMap({ centroid, items, deviceLocation, onSelect }: KengeriMapProps) {
  const mapRef = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const itemMarkersRef = useRef<Marker[]>([]);
  const deviceMarkerRef = useRef<Marker | null>(null);

  const bounds = useMemo<LngLatBoundsLike>(() => {
    if (items.length === 0) {
      return [
        [centroid.lng, centroid.lat],
        [centroid.lng, centroid.lat],
      ];
    }

    const extent = new LngLatBounds([items[0].lng, items[0].lat], [items[0].lng, items[0].lat]);
    items.forEach((item) => extent.extend([item.lng, item.lat]));
    return extent;
  }, [centroid.lat, centroid.lng, items]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [centroid.lng, centroid.lat],
      zoom: 16,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new AttributionControl({ compact: true }), "bottom-left");

    return () => {
      map.remove();
      mapRef.current = null;
      itemMarkersRef.current = [];
      deviceMarkerRef.current = null;
    };
  }, [centroid.lat, centroid.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    itemMarkersRef.current.forEach((marker) => marker.remove());
    itemMarkersRef.current = [];

    items.forEach((item) => {
      const marker = new Marker({ color: item.type === "lost" ? "#ef4444" : "#22c55e", scale: 0.95 })
        .setLngLat([item.lng, item.lat])
        .addTo(map);

      marker.getElement().addEventListener("click", () => onSelect(item));
      itemMarkersRef.current.push(marker);
    });

    map.fitBounds(bounds, { padding: 36, maxZoom: 17 });
  }, [bounds, items, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (deviceMarkerRef.current) {
      deviceMarkerRef.current.remove();
      deviceMarkerRef.current = null;
    }

    if (!deviceLocation) {
      return;
    }

    deviceMarkerRef.current = new Marker({ color: "#3b82f6", scale: 0.8 }).setLngLat([deviceLocation.lng, deviceLocation.lat]).addTo(map);
  }, [deviceLocation]);

  return <div ref={mapContainerRef} className="h-[calc(100vh-9rem)] w-full" />;
}
