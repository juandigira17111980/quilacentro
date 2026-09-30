import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";

type Point = { id: string; nombre: string; lat: number | null; lng: number | null };

export function InteractiveStoreMap({
  stores,
  selectedId,
  onSelect,
}: {
  stores: Point[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<LayerGroup | null>(null);
  const lastStores = useRef<Point[] | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !element.current || map.current) return;
      leaflet.current = L;
      const instance = L.map(element.current, { scrollWheelZoom: false }).setView(
        [10.9685, -74.7813],
        13,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(instance);
      markers.current = L.layerGroup().addTo(instance);
      map.current = instance;
      requestAnimationFrame(() => instance.invalidateSize());
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      markers.current = null;
      leaflet.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leaflet.current;
    const instance = map.current;
    const group = markers.current;
    if (!L || !instance || !group) return;
    group.clearLayers();
    const points = stores.filter(
      (store): store is Point & { lat: number; lng: number } =>
        store.lat !== null &&
        store.lng !== null &&
        Number.isFinite(store.lat) &&
        Number.isFinite(store.lng),
    );
    for (const store of points) {
      const active = store.id === selectedId;
      L.circleMarker([store.lat, store.lng], {
        radius: active ? 11 : 8,
        color: "#ffffff",
        weight: 2,
        fillColor: active ? "#d6a51a" : "#3b1165",
        fillOpacity: 1,
      })
        .addTo(group)
        .bindTooltip(store.nombre, { direction: "top" })
        .on("click", () => onSelectRef.current(store.id));
    }
    if (points.length && lastStores.current !== stores) {
      instance.fitBounds(L.latLngBounds(points.map((point) => [point.lat, point.lng])), {
        padding: [28, 28],
        maxZoom: 16,
      });
    }
    lastStores.current = stores;
  }, [stores, selectedId, ready]);

  useEffect(() => {
    const selected = stores.find((store) => store.id === selectedId);
    if (selected?.lat != null && selected.lng != null && map.current) {
      map.current.panTo([selected.lat, selected.lng]);
    }
  }, [selectedId, stores]);

  return (
    <div
      ref={element}
      className="h-full min-h-[420px] w-full md:min-h-[620px]"
      role="application"
      aria-label="Mapa interactivo de comercios"
    />
  );
}
