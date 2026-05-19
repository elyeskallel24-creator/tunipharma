import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X, Upload, Trash2 } from "lucide-react";
import { submitPrescriptionOrder, uploadPrescriptionImage } from "@/lib/orders.functions";
import { WILAYAT_TN } from "@/lib/wilayat";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export function PrescriptionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const upload = useServerFn(uploadPrescriptionImage);
  const submit = useServerFn(submitPrescriptionOrder);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState<null | "phone" | "whatsapp">(null);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    contact_method: "phone" as "phone" | "whatsapp",
    wilaya: "",
    address: "",
  });

  if (!open) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 6 - images.length;
    const list = Array.from(files).slice(0, remaining);
    if (list.length === 0) { toast.error("Maximum 6 images"); return; }
    setUploading(true);
    try {
      for (const f of list) {
        if (!f.type.startsWith("image/")) continue;
        const buf = await f.arrayBuffer();
        let binary = "";
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        const r = await upload({ data: { filename: f.name, contentType: f.type, base64 } });
        setImages((p) => [...p, r.url]);
      }
    } catch (e) {
      toast.error("Upload échoué", { description: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) { toast.error("Ajoutez au moins une photo de votre ordonnance"); return; }
    setSubmitting(true);
    try {
      await submit({ data: { ...form, prescription_images: images } });
      setDone(form.contact_method);
    } catch (err) {
      toast.error("Erreur", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(null); setImages([]);
    setForm({ customer_name: "", customer_phone: "", contact_method: "phone", wilaya: "", address: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={reset}>
      <div onClick={(e) => e.stopPropagation()} className="glass-3 rounded-[28px] w-full max-w-2xl max-h-[90vh] overflow-y-auto nice-scroll relative">
        <button onClick={reset} className="absolute top-4 right-4 h-9 w-9 rounded-full glass-2 inline-flex items-center justify-center hover:bg-secondary z-10">
          <X className="h-4 w-4" />
        </button>

        {done ? (
          <div className="p-10 text-center">
            <img src={logo} alt="" className="h-16 w-16 mx-auto" />
            <h2 className="font-display text-2xl md:text-3xl font-bold mt-6">Demande reçue</h2>
            <p className="mt-4 text-base text-foreground leading-relaxed">
              {done === "whatsapp"
                ? "Merci ! Un pharmacien diplômé vous contactera via WhatsApp pour confirmer votre commande après validation de votre ordonnance. Vos données de santé sont traitées de manière confidentielle et conformément à la réglementation en vigueur."
                : "Merci ! Un pharmacien diplômé vous contactera par téléphone pour confirmer votre commande après validation de votre ordonnance. Vos données de santé sont traitées de manière confidentielle et conformément à la réglementation en vigueur."}
            </p>
            <button onClick={reset} className="mt-8 inline-flex h-12 items-center rounded-2xl bg-primary px-7 font-display font-semibold text-primary-foreground hover:bg-primary-glow">
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="p-7 md:p-9 space-y-5">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">J'ai une ordonnance</h2>
              <p className="text-sm text-muted-foreground mt-1">Remplissez le formulaire et joignez vos photos d'ordonnance.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Votre nom et prénom</label>
              <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Numéro de téléphone ou WhatsApp</label>
              <input required type="tel" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Méthode de contact</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { v: "phone", label: "Appel téléphonique" },
                  { v: "whatsapp", label: "WhatsApp" },
                ] as const).map((o) => (
                  <label key={o.v} className={`flex items-center gap-3 h-12 px-4 rounded-xl border cursor-pointer transition ${form.contact_method === o.v ? "border-primary bg-primary/5" : "border-border bg-secondary/60"}`}>
                    <input type="radio" name="rx_contact" checked={form.contact_method === o.v}
                      onChange={() => setForm({ ...form, contact_method: o.v })}
                      className="h-4 w-4 accent-[color:var(--primary)]" />
                    <span className="text-sm font-medium">{o.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Wilaya</label>
              <select required value={form.wilaya} onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Choisir votre wilaya…</option>
                {WILAYAT_TN.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Adresse exacte où vous souhaitez recevoir le produit</label>
              <textarea required rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Ajoutez votre ordonnance (max 6 photos)</label>
              <div className="grid grid-cols-3 gap-3">
                {images.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 h-7 w-7 rounded-full bg-destructive text-white inline-flex items-center justify-center">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {images.length < 6 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/40 transition">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">{uploading ? "Upload…" : "Ajouter"}</span>
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => handleFiles(e.target.files)} />
                  </label>
                )}
              </div>
            </div>

            <button disabled={submitting || uploading} type="submit"
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base hover:bg-primary-glow shadow-elegant transition disabled:opacity-50">
              {submitting ? "Envoi…" : "Suivi de commande"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
