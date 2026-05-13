import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminLogin, adminLogout, adminVerify, adminListAll,
  adminUpsert, adminDelete, adminUpdateOrderStatus, adminUploadImage,
} from "@/lib/admin.functions";
import { useAdminToken } from "@/lib/admin-session";
import { toast } from "sonner";
import { LogOut, Plus, Pencil, Trash2, Upload, Lock, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import { formatTND, slugify } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — TuniPharma" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPage,
});

const TABS = [
  { key: "products", label: "Produits" },
  { key: "categories", label: "Catégories" },
  { key: "product_types", label: "Types" },
  { key: "slider_images", label: "Slider" },
  { key: "orders", label: "Commandes" },
  { key: "about_content", label: "À propos" },
  { key: "settings", label: "Paramètres" },
] as const;
type TabKey = typeof TABS[number]["key"];

function AdminPage() {
  const [token, setToken] = useAdminToken();
  const [verified, setVerified] = useState<boolean | null>(null);
  const verify = useServerFn(adminVerify);

  useEffect(() => {
    if (!token) { setVerified(false); return; }
    verify({ data: { token } }).then((r) => {
      setVerified(r.valid);
      if (!r.valid) setToken(null);
    }).catch(() => { setVerified(false); setToken(null); });
  }, [token]);

  if (verified === null && token) {
    return <div className="min-h-screen flex items-center justify-center">Vérification…</div>;
  }
  if (!token || verified === false) return <PinLogin onSuccess={(t) => { setToken(t); setVerified(true); }} />;
  return <Dashboard token={token} onLogout={() => setToken(null)} />;
}

function PinLogin({ onSuccess }: { onSuccess: (t: string) => void }) {
  const [pin, setPin] = useState("");
  const login = useServerFn(adminLogin);
  const m = useMutation({
    mutationFn: () => login({ data: { pin } }),
    onSuccess: (r) => { onSuccess(r.token); toast.success("Bienvenue admin"); },
    onError: (e) => toast.error("Erreur", { description: (e as Error).message }),
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-strong rounded-3xl p-10 w-full max-w-sm">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-3 w-3" /> Retour au site
        </Link>
        <div className="text-center">
          <img src={logo} alt="" className="h-16 w-16 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold">Espace Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Saisissez votre code PIN</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (pin.length === 4) m.mutate(); }} className="mt-8 space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full h-14 pl-11 pr-4 rounded-xl bg-secondary/60 border border-border text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button disabled={m.isPending || pin.length !== 4} type="submit" className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary-glow disabled:opacity-50 transition">
            {m.isPending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<TabKey>("products");
  const logoutFn = useServerFn(adminLogout);

  return (
    <div className="min-h-screen">
      <header className="glass-strong border-b border-glass-border sticky top-0 z-40">
        <div className="container-page h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" className="h-8 w-8" />
            <span className="font-bold">TuniPharma <span className="text-primary text-sm">Admin</span></span>
          </Link>
          <button
            onClick={async () => { await logoutFn({ data: { token } }); onLogout(); toast.success("Déconnecté"); }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full glass hover:bg-secondary text-sm font-medium"
          >
            <LogOut className="h-4 w-4" /> Quitter
          </button>
        </div>
        <div className="container-page pb-3 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 h-9 rounded-full text-sm font-medium whitespace-nowrap transition ${tab === t.key ? "bg-primary text-primary-foreground" : "glass hover:bg-secondary"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </header>
      <div className="container-page py-8">
        <TabContent key={tab} token={token} tab={tab} />
      </div>
    </div>
  );
}

// ============== TAB CONTENT ==============
type Field = { name: string; label: string; type: "text" | "textarea" | "number" | "boolean" | "image" | "select" | "json"; options?: { value: string; label: string }[]; required?: boolean };

const FIELDS: Record<Exclude<TabKey, "orders">, Field[]> = {
  products: [
    { name: "name", label: "Nom", type: "text", required: true },
    { name: "slug", label: "Slug (URL)", type: "text", required: true },
    { name: "brand", label: "Marque", type: "text" },
    { name: "category_id", label: "Catégorie", type: "select" },
    { name: "type_id", label: "Type", type: "select" },
    { name: "short_description", label: "Description courte", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "price", label: "Prix (DT)", type: "number", required: true },
    { name: "sale_price", label: "Prix promo (DT)", type: "number" },
    { name: "stock", label: "Stock", type: "number" },
    { name: "sku", label: "SKU", type: "text" },
    { name: "image_url", label: "Image principale", type: "image" },
    { name: "requires_prescription", label: "Sur ordonnance", type: "boolean" },
    { name: "is_active", label: "Actif", type: "boolean" },
    { name: "is_featured", label: "Mis en avant", type: "boolean" },
  ],
  categories: [
    { name: "name", label: "Nom", type: "text", required: true },
    { name: "slug", label: "Slug", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "image_url", label: "Image", type: "image" },
    { name: "position", label: "Position", type: "number" },
    { name: "is_active", label: "Actif", type: "boolean" },
  ],
  product_types: [
    { name: "category_id", label: "Catégorie", type: "select", required: true },
    { name: "name", label: "Nom", type: "text", required: true },
    { name: "slug", label: "Slug", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "position", label: "Position", type: "number" },
    { name: "is_active", label: "Actif", type: "boolean" },
  ],
  slider_images: [
    { name: "image_url", label: "Image", type: "image", required: true },
    { name: "title", label: "Titre", type: "text" },
    { name: "subtitle", label: "Sous-titre", type: "text" },
    { name: "cta_text", label: "Texte du bouton", type: "text" },
    { name: "cta_link", label: "Lien du bouton", type: "text" },
    { name: "position", label: "Position", type: "number" },
    { name: "is_active", label: "Actif", type: "boolean" },
  ],
  about_content: [
    { name: "section_key", label: "Clé (mission, vision, ...)", type: "text", required: true },
    { name: "title", label: "Titre", type: "text" },
    { name: "content", label: "Contenu", type: "textarea" },
    { name: "image_url", label: "Image", type: "image" },
    { name: "position", label: "Position", type: "number" },
  ],
  settings: [
    { name: "key", label: "Clé", type: "text", required: true },
    { name: "value", label: "Valeur (JSON)", type: "json", required: true },
    { name: "is_public", label: "Public", type: "boolean" },
  ],
};

function TabContent({ token, tab }: { token: string; tab: TabKey }) {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListAll);
  const upsertFn = useServerFn(adminUpsert);
  const deleteFn = useServerFn(adminDelete);
  const orderStatusFn = useServerFn(adminUpdateOrderStatus);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-list", tab],
    queryFn: async () => (await listFn({ data: { token, table: tab } })).rows,
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-list", "categories"],
    queryFn: async () => (await listFn({ data: { token, table: "categories" } })).rows,
    enabled: tab === "products" || tab === "product_types",
  });
  const { data: types } = useQuery({
    queryKey: ["admin-list", "product_types"],
    queryFn: async () => (await listFn({ data: { token, table: "product_types" } })).rows,
    enabled: tab === "products",
  });

  const upsertM = useMutation({
    mutationFn: (row: Record<string, unknown>) => upsertFn({ data: { token, table: tab as never, row } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-list", tab] }); setEditing(null); toast.success("Enregistré"); },
    onError: (e) => toast.error("Erreur", { description: (e as Error).message }),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { token, table: tab as never, id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-list", tab] }); toast.success("Supprimé"); },
    onError: (e) => toast.error("Erreur", { description: (e as Error).message }),
  });

  if (tab === "orders") {
    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-bold mb-4">Commandes</h2>
        {isLoading ? <div>Chargement…</div> : (data ?? []).length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Aucune commande pour l'instant.</div>
        ) : (
          (data as Array<Record<string, unknown>>).map((o) => <OrderCard key={o.id as string} order={o} onStatus={(s) => orderStatusFn({ data: { token, id: o.id as string, status: s } }).then(() => qc.invalidateQueries({ queryKey: ["admin-list", "orders"] }))} />)
        )}
      </div>
    );
  }

  const fields = FIELDS[tab];
  const idCol = tab === "settings" ? "key" : "id";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{TABS.find(t => t.key === tab)?.label}</h2>
        <button onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary-glow">
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>
      {isLoading ? <div>Chargement…</div> : (
        <div className="glass-strong rounded-2xl overflow-hidden">
          {(data ?? []).length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">Aucun élément. Cliquez sur Ajouter.</div>
          ) : (
            <ul className="divide-y divide-border">
              {(data as Array<Record<string, unknown>>).map((row) => (
                <li key={String(row[idCol])} className="flex items-center gap-3 p-3 hover:bg-secondary/30">
                  {(row as { image_url?: string }).image_url && (
                    <img src={(row as { image_url: string }).image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{(row.name as string) ?? (row.title as string) ?? (row.section_key as string) ?? (row.key as string)}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {tab === "products" && `${formatTND((row.price as number))} • Stock: ${row.stock} • ${row.is_active ? "Actif" : "Inactif"}`}
                      {tab === "categories" && `Slug: ${row.slug}`}
                      {tab === "product_types" && `Slug: ${row.slug}`}
                      {tab === "slider_images" && (row.subtitle as string)}
                    </div>
                  </div>
                  <button onClick={() => setEditing(row)} className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => { if (confirm("Supprimer cet élément ?")) deleteM.mutate(String(row[idCol])); }}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-full text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {editing && (
        <EditModal
          token={token}
          fields={fields}
          row={editing}
          categories={categories as Array<{ id: string; name: string }> | undefined}
          types={types as Array<{ id: string; name: string; category_id: string }> | undefined}
          tab={tab}
          onClose={() => setEditing(null)}
          onSave={(r) => upsertM.mutate(r)}
          saving={upsertM.isPending}
        />
      )}
    </div>
  );
}

function OrderCard({ order, onStatus }: { order: Record<string, unknown>; onStatus: (s: string) => void }) {
  const items = (order.items as Array<{ name: string; quantity: number; price: number }>) ?? [];
  const statusColors: Record<string, string> = {
    pending: "bg-warning/20 text-warning-foreground",
    confirmed: "bg-primary/20 text-primary",
    shipped: "bg-accent text-accent-foreground",
    delivered: "bg-success/20 text-success",
    cancelled: "bg-destructive/20 text-destructive",
  };
  const status = order.status as string;
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">{order.order_number as string}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status]}`}>{status}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">{new Date(order.created_at as string).toLocaleString("fr-FR")}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg gradient-text">{formatTND(order.total as number)}</div>
        </div>
      </div>
      <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="font-semibold">{order.customer_name as string}</div>
          <div className="text-muted-foreground">{order.customer_phone as string}</div>
          <div className="text-muted-foreground">{order.customer_email as string}</div>
        </div>
        <div className="text-muted-foreground">
          {order.address as string}, {order.city as string} {(order.postal_code as string) ?? ""}
        </div>
      </div>
      <ul className="mt-3 text-sm border-t border-border pt-3 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex justify-between"><span>{it.quantity} × {it.name}</span><span>{formatTND(it.price * it.quantity)}</span></li>
        ))}
      </ul>
      {!!order.notes && <div className="mt-3 text-sm text-muted-foreground italic">Note : {order.notes as string}</div>}
      <div className="mt-4 flex gap-2 flex-wrap">
        {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
          <button key={s} onClick={() => onStatus(s)}
            className={`px-3 h-8 rounded-full text-xs font-medium transition ${s === status ? "bg-primary text-primary-foreground" : "glass hover:bg-secondary"}`}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function EditModal(props: {
  token: string;
  fields: Field[];
  row: Record<string, unknown>;
  categories?: Array<{ id: string; name: string }>;
  types?: Array<{ id: string; name: string; category_id: string }>;
  tab: TabKey;
  onClose: () => void;
  onSave: (row: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const { token, fields, row, categories, types, tab, onClose, onSave, saving } = props;
  const [form, setForm] = useState<Record<string, unknown>>(row);
  const uploadFn = useServerFn(adminUploadImage);

  const handleUpload = async (field: string, file: File) => {
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    try {
      const r = await uploadFn({ data: { token, filename: file.name, contentType: file.type, base64, folder: tab } });
      setForm((f) => ({ ...f, [field]: r.url }));
      toast.success("Image téléversée");
    } catch (e) { toast.error("Erreur upload", { description: (e as Error).message }); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned: Record<string, unknown> = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v === "" || v === undefined) return;
      cleaned[k] = v;
    });
    if (row.id) cleaned.id = row.id;
    if (tab === "settings" && row.key) cleaned.key = row.key;
    onSave(cleaned);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="glass-strong rounded-3xl p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">{row.id || row.key ? "Modifier" : "Ajouter"}</h3>
        <form onSubmit={submit} className="space-y-3">
          {fields.map((f) => {
            const val = form[f.name];
            if (f.type === "boolean") {
              return (
                <label key={f.name} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 cursor-pointer">
                  <input type="checkbox" checked={!!val} onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} className="h-5 w-5 accent-[var(--primary)]" />
                  <span className="font-medium">{f.label}</span>
                </label>
              );
            }
            if (f.type === "image") {
              return (
                <div key={f.name}>
                  <label className="text-sm font-medium block mb-1">{f.label}</label>
                  <div className="flex gap-2 items-center">
                    {typeof val === "string" && val && <img src={val} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                    <input type="text" value={(val as string) ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} placeholder="URL ou téléverser →"
                      className="flex-1 h-11 px-3 rounded-xl bg-secondary/60 border border-border text-sm" />
                    <label className="inline-flex items-center gap-1 h-11 px-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:bg-primary-glow">
                      <Upload className="h-4 w-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(f.name, e.target.files[0])} />
                    </label>
                  </div>
                </div>
              );
            }
            if (f.type === "select") {
              const opts = f.name === "category_id" ? categories ?? [] : f.name === "type_id" ? (types ?? []).filter((t) => !form.category_id || t.category_id === form.category_id) : [];
              return (
                <div key={f.name}>
                  <label className="text-sm font-medium block mb-1">{f.label}</label>
                  <select value={(val as string) ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value || null })}
                    className="w-full h-11 px-3 rounded-xl bg-secondary/60 border border-border">
                    <option value="">— Aucun —</option>
                    {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              );
            }
            if (f.type === "textarea") {
              return (
                <div key={f.name}>
                  <label className="text-sm font-medium block mb-1">{f.label}</label>
                  <textarea value={(val as string) ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full p-3 rounded-xl bg-secondary/60 border border-border min-h-[100px]" />
                </div>
              );
            }
            if (f.type === "json") {
              return (
                <div key={f.name}>
                  <label className="text-sm font-medium block mb-1">{f.label}</label>
                  <textarea value={typeof val === "string" ? val : JSON.stringify(val ?? {}, null, 2)}
                    onChange={(e) => {
                      try { setForm({ ...form, [f.name]: JSON.parse(e.target.value) }); }
                      catch { setForm({ ...form, [f.name]: e.target.value }); }
                    }}
                    className="w-full p-3 rounded-xl bg-secondary/60 border border-border min-h-[160px] font-mono text-xs" />
                </div>
              );
            }
            return (
              <div key={f.name}>
                <label className="text-sm font-medium block mb-1">{f.label}{f.required && " *"}</label>
                <input type={f.type} value={(val as string | number) ?? ""}
                  step={f.type === "number" ? "0.001" : undefined}
                  onChange={(e) => {
                    const v = f.type === "number" ? (e.target.value === "" ? null : parseFloat(e.target.value)) : e.target.value;
                    setForm({ ...form, [f.name]: v });
                    if (f.name === "name" && !form.slug) setForm((p) => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }));
                  }}
                  required={f.required}
                  className="w-full h-11 px-3 rounded-xl bg-secondary/60 border border-border" />
              </div>
            );
          })}
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-full glass hover:bg-secondary font-medium">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 h-11 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary-glow disabled:opacity-50">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
