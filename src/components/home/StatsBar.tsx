import { useEffect, useRef, useState } from "react";
import { Store, Building2, Star, MapPin } from "lucide-react";

function useCountUp(target: number, start: boolean, duration = 1500, decimals = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);
  return decimals ? val.toFixed(decimals) : Math.floor(val).toString();
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setInView(true),
      { threshold: 0.3 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const products = useCountUp(500, inView);
  const stores = useCountUp(20, inView);
  const rating = useCountUp(4.8, inView, 1500, 1);

  const items = [
    { icon: Store, value: `${products}+`, label: "Productos disponibles" },
    { icon: Building2, value: stores, label: "Comercios activos" },
    { icon: Star, value: rating, label: "Calificación promedio" },
    { icon: MapPin, value: "Centro", label: "Barranquilla" },
  ];

  return (
    <section ref={ref} className="bg-slate-900 text-white">
      <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4 md:py-12">
        {items.map((it, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <it.icon className="mb-2 h-6 w-6 text-orange-400" />
            <div className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              {it.value}
            </div>
            <div className="mt-1 text-xs text-slate-300 md:text-sm">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
