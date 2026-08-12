import { useEffect, useState } from "react";

type Note = { id: number; left: number; delay: number; scale: number };

export const SALE_EVENT = "eleve:sale";

export function emitSaleEvent(detail?: unknown) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SALE_EVENT, { detail }));
  }
}

export function MoneyRain() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const handler = () => {
      const batch: Note[] = Array.from({ length: 18 }, (_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 96,
        delay: Math.random() * 0.9,
        scale: 0.7 + Math.random() * 0.8,
      }));
      setNotes((prev) => [...prev, ...batch]);
      setTimeout(() => {
        setNotes((prev) => prev.filter((n) => !batch.some((b) => b.id === n.id)));
      }, 4000);
    };
    window.addEventListener(SALE_EVENT, handler);
    return () => window.removeEventListener(SALE_EVENT, handler);
  }, []);

  if (notes.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      {notes.map((n) => (
        <span
          key={n.id}
          className="animate-money absolute bottom-0 select-none text-3xl"
          style={{
            left: `${n.left}%`,
            animationDelay: `${n.delay}s`,
            transform: `scale(${n.scale})`,
          }}
        >
          💵
        </span>
      ))}
    </div>
  );
}
