import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadAndGetUrl, safeFileName } from "@/lib/storage";
import { toast } from "sonner";

type Props = {
  bucket: string;
  pathPrefix: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: "square" | "wide";
};

export function ImageUploader({
  bucket,
  pathPrefix,
  value,
  onChange,
  label = "Imagen",
  aspect = "square",
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }
    setBusy(true);
    try {
      const path = `${pathPrefix}/${safeFileName(file.name)}`;
      const url = await uploadAndGetUrl(bucket, path, file);
      onChange(url);
      toast.success("Imagen subida");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error subiendo imagen";
      toast.error(msg);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div
        className={`relative overflow-hidden rounded-lg border bg-muted ${
          aspect === "wide" ? "aspect-[3/1]" : "aspect-square w-40"
        }`}
      >
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-foreground shadow"
              aria-label="Eliminar imagen"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <div className="text-center text-xs">Sin imagen</div>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => ref.current?.click()}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {value ? "Reemplazar" : "Subir imagen"}
      </Button>
    </div>
  );
}

export function MultiImageUploader({
  bucket,
  pathPrefix,
  values,
  onChange,
  max = 4,
}: {
  bucket: string;
  pathPrefix: string;
  values: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList) => {
    if (values.length + files.length > max) {
      toast.error(`Máximo ${max} imágenes adicionales`);
      return;
    }
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) continue;
        const path = `${pathPrefix}/${safeFileName(file.name)}`;
        const url = await uploadAndGetUrl(bucket, path, file);
        uploaded.push(url);
      }
      onChange([...values, ...uploaded]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error subiendo imágenes";
      toast.error(msg);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">
        Imágenes adicionales ({values.length}/{max})
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((u, i) => (
          <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border">
            <img src={u} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 shadow"
              aria-label="Eliminar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {values.length < max && (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="grid h-20 w-20 place-items-center rounded-lg border border-dashed bg-muted text-muted-foreground hover:bg-muted/70"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
        }}
      />
    </div>
  );
}
