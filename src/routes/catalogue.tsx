import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { Search } from "lucide-react";

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
  const [q, setQ] = useState("");
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
    queryKey: ["products", cat, q],
    queryFn: async () => {
      let query = supabase.from("products")
        .select("id, slug, name, short_description, price, sale_price, image_url, requires_prescription, brand")
        .eq("is_active", true).order("created_at", { ascending: false }).limit(60);
      if (cat) query = query.eq("category_id", cat);
      if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
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
    <div className="container-page py-8 md:py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Catalogue</h1>
        <p className="text-muted-foreground mt-2">Tous nos produits, en un coup d'œil.</p>
      </header>

      <div className="glass-strong rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={cat ?? ""}
          onChange={(e) => setCat(e.target.value || null)}
          className="h-12 px-4 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[200px]"
        >
          <option value="">Toutes catégories</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setCat(null)}
            className={`px-4 h-9 rounded-full text-sm font-medium transition ${!cat ? "bg-primary text-primary-foreground" : "glass hover:bg-secondary"}`}>
            Tout
          </button>
          {categories.map((c) => (
            <Link key={c.id} to="/categorie/$slug" params={{ slug: c.slug }}
              className="px-4 h-9 inline-flex items-center rounded-full text-sm font-medium glass hover:bg-secondary transition">
              {c.name}
            </Link>
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
