import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";

export const Route = createFileRoute("/categorie/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();

  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["category-products", category?.id],
    enabled: !!category?.id,
    queryFn: async () => {
      const { data } = await supabase.from("products")
        .select("id, slug, name, short_description, price, sale_price, image_url, requires_prescription, brand")
        .eq("is_active", true).eq("category_id", category!.id).order("created_at", { ascending: false });
      return (data ?? []) as ProductCardData[];
    },
  });

  if (!category) return <div className="container-page py-16">Chargement…</div>;

  return (
    <div className="container-page py-8 md:py-12">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Accueil</Link> / <Link to="/catalogue" className="hover:text-primary">Catalogue</Link> / <span className="text-foreground">{category.name}</span>
      </nav>
      <header className="glass-strong rounded-3xl p-8 mb-8">
        <h1 className="text-4xl font-bold">{category.name}</h1>
        {category.description && <p className="text-muted-foreground mt-2 max-w-2xl">{category.description}</p>}
      </header>
      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground">Aucun produit dans cette catégorie.</div>
      )}
    </div>
  );
}
