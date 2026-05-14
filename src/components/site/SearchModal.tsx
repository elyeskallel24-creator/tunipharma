import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { formatTND } from "@/lib/format";

interface Result {
  id: string;
  slug: string;
  name: string;
  price: number;
  sale_price: number | null;
  image_url: string | null;
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) { setQ(""); setResults([]); return; }
    const t = setTimeout(async () => {
      const term = q.trim();
      if (!term) { setResults([]); return; }
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, slug, name, price, sale_price, image_url")
        .eq("is_active", true)
        .or(`name.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%`)
        .limit(8);
      setResults((data ?? []) as Result[]);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center px-4 pt-24"
      style={{ background: "rgba(0, 20, 15, 0.3)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "floatIn 0.35s cubic-bezier(0.23, 1, 0.32, 1)" }}
      >
        <div className="glass-4 rounded-3xl px-5 py-4 flex items-center gap-3">
          <Search className="h-5 w-5 text-primary shrink-0" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit, une marque, une catégorie..."
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-secondary/60"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {(q.trim() || loading) && (
          <div className="mt-3 glass-3 rounded-3xl p-3 max-h-[60vh] overflow-y-auto nice-scroll">
            {loading && results.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">Recherche en cours...</div>
            )}
            {!loading && results.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Aucun produit trouvé pour cette recherche.
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-2">
              {results.map((p, i) => (
                <Link
                  key={p.id}
                  to="/produit/$slug"
                  params={{ slug: p.slug }}
                  onClick={onClose}
                  className="glass-1 rounded-2xl p-2.5 flex items-center gap-3 hover:bg-primary/5 transition"
                  style={{ animation: `floatIn 0.3s ${i * 30}ms both` }}
                >
                  <div className="h-12 w-12 rounded-xl bg-secondary overflow-hidden shrink-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-primary/30">℞</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-primary font-bold mt-0.5">
                      {formatTND(p.sale_price ?? p.price)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
