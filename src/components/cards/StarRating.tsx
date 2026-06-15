import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  size = "sm",
  showNumber = false,
  count,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  count?: number;
}) {
  const px = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              px,
              i <= Math.round(value) ? "fill-accent text-accent" : "text-muted-foreground/30",
            )}
          />
        ))}
      </div>
      {showNumber && (
        <span className="text-sm font-medium">{(value ?? 0).toFixed(1)}</span>
      )}
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}

export function InteractiveStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="rounded p-0.5 transition hover:scale-110"
          aria-label={`${i} estrella${i > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "h-6 w-6",
              i <= value ? "fill-accent text-accent" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
