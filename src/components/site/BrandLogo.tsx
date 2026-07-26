import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  tone?: "default" | "light";
};

export function BrandLogo({ className, compact = false, tone = "default" }: BrandLogoProps) {
  const suffix = tone === "light" ? "-light" : "";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label="Mercanta">
      <img
        src={`/brand/mercanta-mark${suffix}.png`}
        alt=""
        aria-hidden="true"
        className="h-9 w-11 object-contain"
      />
      {!compact && (
        <img
          src={`/brand/mercanta-wordmark${suffix}.png`}
          alt="Mercanta"
          className="h-5 w-[126px] object-contain object-left"
        />
      )}
    </span>
  );
}
