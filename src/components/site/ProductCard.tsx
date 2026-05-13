import { Link } from "@tanstack/react-router";
import { ShoppingBag, FileText } from "lucide-react";
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
  requires_prescription: boolean;
  brand: string | null;
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const add = useCart((s) => s.add);
  const final = p.sale_price ?? p.price;

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: final,
      image_url: p.image_url,
      requires_prescription: p.requires_prescription,
    });
    toast.success("Ajouté au panier", { description: p.name });
  };

  return (
    <Link
      to="/produit/$slug"
      params={{ slug: p.slug }}
      className="group glass rounded-3xl overflow-hidden flex flex-col transition hover:shadow-elegant hover:-translate-y-1 duration-300"
    >
      <div className="relative aspect-square bg-gradient-to-br from-secondary to-accent/30 overflow-hidden">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-primary/30 text-6xl">℞</div>
        )}
        {p.sale_price && p.sale_price < p.price && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
            PROMO
          </span>
        )}
        {p.requires_prescription && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass-strong text-[10px] font-semibold">
            <FileText className="h-3 w-3" /> Ordonnance
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        {p.brand && <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.brand}</p>}
        <h3 className="font-semibold leading-tight line-clamp-2 mt-0.5">{p.name}</h3>
        {p.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.short_description}</p>
        )}
        <div className="mt-3 flex items-end justify-between gap-2 mt-auto pt-3">
          <div>
            {p.sale_price && p.sale_price < p.price && (
              <span className="text-xs text-muted-foreground line-through mr-1">{formatTND(p.price)}</span>
            )}
            <span className="font-bold text-primary">{formatTND(final)}</span>
          </div>
          <button
            onClick={onAdd}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-glow transition shadow-md"
            aria-label="Ajouter au panier"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
