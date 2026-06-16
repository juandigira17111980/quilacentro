import { useEffect, useId, useRef, useState } from "react";
import { Camera } from "lucide-react";

type PannellumViewer = { destroy: () => void };
type PannellumGlobal = {
  viewer: (id: string, config: Record<string, unknown>) => PannellumViewer;
};

declare global {
  interface Window {
    pannellum?: PannellumGlobal;
  }
}

const STRINGS = {
  loadButtonLabel: "Hacer clic para cargar el tour",
  loadingLabel: "Cargando...",
  bylineLabel: "",
  noPanoramaError: "No se encontró la imagen panorámica.",
  fileAccessError: "No se pudo acceder a la imagen panorámica.",
  malformedURLError: "URL de panorámica incorrecta.",
  iOS8WebGLError: "Debido a un error en iOS 8, las panorámicas 360° no están disponibles.",
  genericWebGLError: "Tu navegador no soporta WebGL.",
  textureSizeError: "La imagen es demasiado grande para tu dispositivo.",
  unknownError: "Error desconocido.",
};

function waitForPannellum(timeoutMs = 8000): Promise<PannellumGlobal> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (typeof window !== "undefined" && window.pannellum) {
        resolve(window.pannellum);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("Pannellum no se pudo cargar"));
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });
}

export function Pannellum360Viewer({
  imageUrl,
  height = 450,
}: {
  imageUrl: string;
  height?: number;
}) {
  const reactId = useId();
  const divId = `pano-${reactId.replace(/[:]/g, "")}`;
  const viewerRef = useRef<PannellumViewer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    waitForPannellum()
      .then((p) => {
        if (cancelled) return;
        try {
          viewerRef.current = p.viewer(divId, {
            type: "equirectangular",
            panorama: imageUrl,
            autoLoad: true,
            autoRotate: -2,
            compass: false,
            showZoomCtrl: true,
            showFullscreenCtrl: true,
            mouseZoom: true,
            hfov: 100,
            pitch: 0,
            yaw: 0,
            strings: STRINGS,
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "No se pudo iniciar el tour");
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
      try {
        viewerRef.current?.destroy();
      } catch {
        /* noop */
      }
      viewerRef.current = null;
    };
  }, [divId, imageUrl]);

  if (error) {
    return (
      <div
        className="grid place-items-center rounded-xl bg-neutral-900 text-center text-white/70"
        style={{ height }}
      >
        <div>
          <Camera className="mx-auto h-12 w-12 text-white/30" />
          <p className="mt-2 text-sm">Tour virtual no disponible temporalmente</p>
        </div>
      </div>
    );
  }

  return (
    <div
      id={divId}
      className="relative w-full overflow-hidden rounded-xl bg-black"
      style={{ height }}
    />
  );
}
