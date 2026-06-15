import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StoreMiniMap({
  lat,
  lng,
  name,
  height = 300,
}: {
  lat: number | null | undefined;
  lng: number | null | undefined;
  name: string;
  height?: number;
}) {
  if (lat == null || lng == null) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border bg-muted text-sm text-muted-foreground"
        style={{ height }}
      >
        <MapPin className="mr-2 h-4 w-4" /> Sin ubicación registrada
      </div>
    );
  }
  const d = 0.005;
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
      <iframe
        title={`Mapa de ${name}`}
        src={src}
        className="w-full border-0"
        style={{ height }}
        loading="lazy"
      />
      <div className="flex items-center justify-between gap-2 border-t bg-card p-3">
        <p className="truncate text-xs text-muted-foreground">
          <MapPin className="mr-1 inline h-3.5 w-3.5" />
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
        <Button asChild size="sm" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
          <a href={directions} target="_blank" rel="noopener noreferrer">
            <Navigation className="mr-1.5 h-3.5 w-3.5" /> Cómo llegar
          </a>
        </Button>
      </div>
    </div>
  );
}
