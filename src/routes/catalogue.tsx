import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";

export const Route = createFileRoute("/catalogue")({
  head: () => ({
    meta: [
      { title: "Catalogue , TuniPharma" },
      { name: "description", content: "Découvrez tout notre catalogue de médicaments et produits de parapharmacie." },
    ],
  }),
  component: CataloguePage,
});

function CataloguePage() {
  const [cat, setCat] = useState<string | null>(null);

  const { data: slides } = useQuery({
    queryKey: ["slides"],
    queryFn: async () =>
      (await supabase.from("slider_images").select("*").eq("is_active", true).order("position")).data ?? [],
  });

  const { data: categories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => (await supabase.from("categories").select("*").eq("is_active", true).order("position")).data ?? [],
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", cat],
    queryFn: async () => {
      let query = supabase.from("products")
        .select("id, slug, name, short_description, price, sale_price, image_url, requires_prescription, brand")
        .eq("is_active", true).order("created_at", { ascending: false }).limit(120);
      if (cat) query = query.eq("category_id", cat);
      const { data } = await query;
      return (data ?? []) as ProductCardData[];
    },
  });

  const list = slides ?? [];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 5500);
    return () => clearInterval(t);
  }, [list.length]);
  const hero = list[idx];

  return (
    <div className="container-page py-8 md:py-12 space-y-8">
      {list.length > 0 && (
        <section className="relative">
          <div className="relative overflow-hidden rounded-[32px] glass-3 min-h-[260px] md:min-h-[340px] flex items-end">
            {hero?.image_url && (
              <img
                key={hero.id}
                src={hero.image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ animation: "slideInRight 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
              />
            )}
            {(hero?.title || hero?.subtitle) && (
              <div
                className="relative w-full p-6 md:p-10"
                style={{ background: "linear-gradient(0deg, rgba(255,255,255,0.92) 30%, rgba(255,255,255,0.35) 70%, transparent 100%)" }}
              >
                {hero?.title && (
                  <h2 className="font-display text-2xl md:text-4xl font-bold leading-tight max-w-2xl">{hero.title}</h2>
                )}
                {hero?.subtitle && (
                  <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl">{hero.subtitle}</p>
                )}
              </div>
            )}
          </div>
          {list.length > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {list.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === idx ? 64 : 32,
                    height: 4,
                    background: i === idx ? "var(--primary)" : "rgba(0,200,150,0.2)",
                  }}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <header>
        <h1 className="text-4xl font-bold">Catalogue</h1>
        <p className="text-muted-foreground mt-2">Tous nos produits, en un coup d'œil.</p>
      </header>

      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCat(null)}
            className={`px-4 h-9 rounded-full text-sm font-medium transition ${!cat ? "bg-primary text-primary-foreground" : "glass hover:bg-secondary"}`}>
            Tout
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`px-4 h-9 inline-flex items-center rounded-full text-sm font-medium transition ${cat === c.id ? "bg-primary text-primary-foreground" : "glass hover:bg-secondary"}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] glass rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
          Aucun produit trouvé.
        </div>
      )}
    </div>
  );
}
