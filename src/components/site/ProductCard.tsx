import { Link } from "@tanstack/react-router";
import { Plus, Minus, FileText, Sparkles } from "lucide-react";
import { useRef, useState, useMemo } from "react";
import { formatTND } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  gallery?: unknown;
  requires_prescription: boolean;
  brand: string | null;
}

export function ProductCard({ p, large = false }: { p: ProductCardData; large?: boolean }) {
  const add = useCart((s) => s.add);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const final = p.sale_price ?? p.price;
  const onSale = p.sale_price && p.sale_price < p.price;

  const images = useMemo(() => {
    const arr: string[] = [];
    if (p.image_url) arr.push(p.image_url);
    if (Array.isArray(p.gallery)) {
      for (const g of p.gallery as unknown[]) if (typeof g === "string") arr.push(g);
    }
    return arr.slice(0, 6);
  }, [p.image_url, p.gallery]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const card = cardRef.current; if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tiltX = ((y - rect.height / 2) / rect.height) * -8;
    const tiltY = ((x - rect.width / 2) / rect.width) * 8;
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.22) 0%, transparent 55%)`;
    }
  };
  const onLeave = () => {
    const card = cardRef.current; if (!card) return;
    card.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
    card.style.transform = "";
    setTimeout(() => { if (cardRef.current) cardRef.current.style.transition = ""; }, 600);
    if (glareRef.current) glareRef.current.style.background = "";
  };

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    add({
      id: p.id, slug: p.slug, name: p.name, price: final,
      image_url: p.image_url, requires_prescription: p.requires_prescription,
    }, qty);
    toast.success("Ajouté au panier", { description: `${qty} × ${p.name}` });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`group glass-2 relative rounded-3xl p-5 flex flex-col ${large ? "min-h-[440px]" : ""}`}
      style={{ overflow: "hidden", willChange: "transform", transition: "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)" }}
    >
      <div ref={glareRef} className="pointer-events-none absolute inset-0 rounded-3xl" />

      {onSale && (
        <span
          className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
          style={{ background: "linear-gradient(135deg, #00C896, #00A878)", boxShadow: "0 4px 16px rgba(0,200,150,0.35)" }}
        >
          <Sparkles className="inline h-3 w-3 mr-1 -mt-0.5" /> Promo
        </span>
      )}
      {p.requires_prescription && (
        <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass-1 text-[10px] font-semibold">
          <FileText className="h-3 w-3" /> Ordonnance
        </span>
      )}

      <Link to="/produit/$slug" params={{ slug: p.slug }} className="block relative">
        <div
          className="relative aspect-square rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ background: "rgba(0, 200, 150, 0.05)" }}
        >
          {images[activeImg] ? (
            <img
              src={images[activeImg]}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="text-primary/30 text-7xl font-bold">℞</div>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveImg(i); }}
                aria-label={`Image ${i + 1}`}
                className="rounded-full transition-all"
                style={{
                  width: i === activeImg ? 22 : 8,
                  height: 8,
                  background: i === activeImg ? "var(--primary)" : "rgba(0, 200, 150, 0.25)",
                }}
              />
            ))}
          </div>
        )}
      </Link>

      <div className="mt-4 flex flex-col flex-1">
        {p.brand && <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{p.brand}</p>}
        <Link to="/produit/$slug" params={{ slug: p.slug }} className="font-display font-semibold leading-tight line-clamp-2 mt-1 hover:text-primary transition">
          {p.name}
        </Link>
        {p.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{p.short_description}</p>
        )}
        <div className="flex-1" />
        <div className="mt-4 flex items-center gap-2">
          <div className="inline-flex items-center rounded-2xl border h-10 overflow-hidden shrink-0"
               style={{ background: "rgba(0,200,150,0.06)", borderColor: "rgba(0,200,150,0.22)" }}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-10 w-9 inline-flex items-center justify-center text-primary hover:bg-primary/10 transition active:scale-90">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-7 text-center text-sm font-bold">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="h-10 w-9 inline-flex items-center justify-center text-primary hover:bg-primary/10 transition active:scale-90">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={onAdd}
            className="flex-1 h-10 px-2 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-xs sm:text-sm hover:bg-primary-glow transition shadow-md hover:-translate-y-0.5 truncate min-w-0"
          >
            <span className="hidden sm:inline">Ajouter, </span><span className="whitespace-nowrap">{formatTND(final * qty)}</span>
          </button>
        </div>
        {onSale && (
          <div className="mt-1.5 text-xs text-muted-foreground">
            <span className="line-through mr-1">{formatTND(p.price * qty)}</span>
            <span className="text-primary font-semibold">vous économisez {formatTND((p.price - final) * qty)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
