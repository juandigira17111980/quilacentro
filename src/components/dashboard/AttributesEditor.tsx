import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AttributesEditor({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const entries = Object.entries(value);

  const setKey = (oldKey: string, newKey: string) => {
    if (newKey === oldKey) return;
    const next: Record<string, string> = {};
    for (const [k, v] of entries) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  };
  const setVal = (k: string, v: string) => onChange({ ...value, [k]: v });
  const remove = (k: string) => {
    const next = { ...value };
    delete next[k];
    onChange(next);
  };
  const add = () => {
    let k = "atributo";
    let i = 1;
    while (k in value) {
      k = `atributo_${i++}`;
    }
    onChange({ ...value, [k]: "" });
  };

  return (
    <div className="space-y-2">
      {entries.length === 0 && (
        <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
          Sin atributos. Ej: color, material, peso.
        </div>
      )}
      {entries.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input value={k} onChange={(e) => setKey(k, e.target.value)} placeholder="Clave" className="h-9" />
          <Input value={v} onChange={(e) => setVal(k, e.target.value)} placeholder="Valor" className="h-9" />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(k)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-2 h-4 w-4" /> Agregar atributo
      </Button>
    </div>
  );
}
