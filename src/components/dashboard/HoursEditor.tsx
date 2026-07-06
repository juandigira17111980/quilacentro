import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

const DAYS: Array<{ key: string; label: string }> = [
  { key: "lun", label: "Lunes" },
  { key: "mar", label: "Martes" },
  { key: "mie", label: "Miércoles" },
  { key: "jue", label: "Jueves" },
  { key: "vie", label: "Viernes" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

export type HoursMap = Record<string, { open?: string; close?: string; closed?: boolean }>;

export function HoursEditor({
  value,
  onChange,
}: {
  value: HoursMap;
  onChange: (h: HoursMap) => void;
}) {
  const update = (
    key: string,
    patch: Partial<{ open: string; close: string; closed: boolean }>,
  ) => {
    onChange({ ...value, [key]: { ...(value[key] ?? {}), ...patch } });
  };

  return (
    <div className="space-y-2">
      {DAYS.map(({ key, label }) => {
        const day = value[key] ?? {};
        return (
          <div
            key={key}
            className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-2 rounded-lg border p-2"
          >
            <div className="text-sm font-medium">{label}</div>
            <Input
              type="time"
              value={day.open ?? ""}
              onChange={(e) => update(key, { open: e.target.value, closed: false })}
              disabled={day.closed}
              className="h-9"
            />
            <Input
              type="time"
              value={day.close ?? ""}
              onChange={(e) => update(key, { close: e.target.value, closed: false })}
              disabled={day.closed}
              className="h-9"
            />
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={!!day.closed}
                onCheckedChange={(c) =>
                  update(key, { closed: !!c, open: c ? "" : day.open, close: c ? "" : day.close })
                }
              />
              Cerrado
            </label>
          </div>
        );
      })}
    </div>
  );
}
