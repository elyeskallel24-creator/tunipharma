import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShoppingBag, FileText, Minus, Plus, ShieldCheck, Truck, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatTND } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";

export const Route = createFileRoute("/produit/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, categories(name, slug)").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) return <div className="container-page py-16">Chargement…</div>;
  if (!product) return null;

  const final = product.sale_price ?? product.price;
  const gallery: string[] = Array.isArray(product.gallery) ? (product.gallery as string[]) : [];
  const images = [product.image_url, ...gallery].filter(Boolean) as string[];

  return (
    <div className="container-page py-8 md:py-12">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary">Accueil</Link> / <Link to="/catalogue" className="hover:text-primary">Catalogue</Link>
        {product.categories && (
          <> / <Link to="/categorie/$slug" params={{ slug: (product.categories as { slug: string }).slug }} className="hover:text-primary">{(product.categories as { name: string }).name}</Link></>
        )} / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-strong rounded-3xl p-6">
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-secondary to-accent/30 overflow-hidden">
            {images[0] ? (
              <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary/30 text-9xl">℞</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((img, i) => (
                <img key={i} src={img} alt="" className="aspect-square rounded-xl object-cover bg-secondary" />
              ))}
            </div>
          )}
        </div>

        <div>
          {product.brand && <p className="text-sm uppercase tracking-wider text-muted-foreground">{product.brand}</p>}
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{product.name}</h1>
          {product.short_description && <p className="text-lg text-muted-foreground mt-3">{product.short_description}</p>}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-4xl font-bold gradient-text">{formatTND(final)}</span>
            {product.sale_price && product.sale_price < product.price && (
              <span className="text-lg text-muted-foreground line-through">{formatTND(product.price)}</span>
            )}
          </div>

          {product.requires_prescription && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-warning/15 text-warning-foreground border border-warning/30 text-sm">
              <FileText className="h-4 w-4" /> Ordonnance requise — à présenter à la livraison.
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="inline-flex items-center glass rounded-full">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-12 inline-flex items-center justify-center hover:bg-secondary rounded-l-full">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="h-12 w-12 inline-flex items-center justify-center hover:bg-secondary rounded-r-full">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => {
                add({
                  id: product.id, slug: product.slug, name: product.name,
                  price: final, image_url: product.image_url,
                  requires_prescription: product.requires_prescription,
                }, qty);
                toast.success("Ajouté au panier", { description: `${qty} × ${product.name}` });
              }}
              className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary-glow shadow-elegant transition"
            >
              <ShoppingBag className="h-4 w-4" /> Ajouter au panier
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="glass rounded-xl p-3">
              <Truck className="h-5 w-5 mx-auto text-primary" />
              <div className="mt-1 font-medium">Livraison 24h</div>
            </div>
            <div className="glass rounded-xl p-3">
              <ShieldCheck className="h-5 w-5 mx-auto text-primary" />
              <div className="mt-1 font-medium">Authentique</div>
            </div>
            <div className="glass rounded-xl p-3">
              <Check className="h-5 w-5 mx-auto text-primary" />
              <div className="mt-1 font-medium">{product.stock > 0 ? "En stock" : "Sur commande"}</div>
            </div>
          </div>

          {product.description && (
            <div className="mt-8 glass rounded-2xl p-6">
              <h2 className="font-semibold mb-3">Description</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
