import { useEffect, useRef, useState, useCallback } from "react";
import { Maximize2, X, Camera } from "lucide-react";

type Props = {
  imageUrl: string;
  alt?: string;
  className?: string;
  height?: number;
};

function Viewer({
  imageUrl,
  alt = "Tour 360°",
  fullscreen = false,
}: {
  imageUrl: string;
  alt?: string;
  fullscreen?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const [bounds, setBounds] = useState({ min: 0, max: 0 });
  const [showHint, setShowHint] = useState(true);

  const recompute = useCallback(() => {
    const c = containerRef.current;
    const i = imgRef.current;
    if (!c || !i) return;
    const cw = c.clientWidth;
    const iw = i.clientWidth;
    const max = 0;
    const min = Math.min(0, cw - iw);
    setBounds({ min, max });
    setOffset((o) => Math.min(max, Math.max(min, o)) || (min + max) / 2);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [recompute]);

  const onDown = (clientX: number) => {
    setDragging(true);
    startX.current = clientX;
    startOffset.current = offset;
  };
  const onMove = (clientX: number) => {
    if (!dragging) return;
    const delta = clientX - startX.current;
    const next = Math.min(bounds.max, Math.max(bounds.min, startOffset.current + delta));
    setOffset(next);
  };
  const onUp = () => setDragging(false);

  useEffect(() => {
    if (!dragging) return;
    const mm = (e: MouseEvent) => onMove(e.clientX);
    const mu = () => onUp();
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, bounds.min, bounds.max]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden bg-black select-none ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      onMouseDown={(e) => { e.preventDefault(); onDown(e.clientX); }}
      onTouchStart={(e) => onDown(e.touches[0].clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onTouchEnd={onUp}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt={alt}
        onLoad={recompute}
        draggable={false}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 300ms ease-out",
        }}
        className="h-full max-w-none select-none"
      />

      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
        <Camera className="h-3.5 w-3.5" />
        Vista 360°
      </div>

      <div
        className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-xs text-white backdrop-blur transition-opacity duration-500 ${
          showHint || fullscreen ? "opacity-100" : "opacity-0"
        }`}
      >
        ← Arrastra para explorar el local →
      </div>
    </div>
  );
}

export function Tour360Viewer({ imageUrl, alt, className = "", height = 400 }: Props) {
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [full]);

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/10 shadow-[var(--shadow-elevated)] ${className}`}
        style={{ height }}
      >
        <Viewer imageUrl={imageUrl} alt={alt} />
        <button
          type="button"
          onClick={() => setFull(true)}
          aria-label="Pantalla completa"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {full && (
        <div className="fixed inset-0 z-[100] bg-black">
          <Viewer imageUrl={imageUrl} alt={alt} fullscreen />
          <button
            type="button"
            onClick={() => setFull(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-[101] grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}
