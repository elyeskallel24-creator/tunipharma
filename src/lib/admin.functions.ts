import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function requireAdmin(token: string | undefined | null) {
  if (!token) throw new Error("Non autorisé");
  const { data, error } = await supabaseAdmin
    .from("admin_sessions")
    .select("token, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) throw new Error("Session invalide");
  if (new Date(data.expires_at) < new Date()) {
    await supabaseAdmin.from("admin_sessions").delete().eq("token", token);
    throw new Error("Session expirée");
  }
  return true;
}

// ========== AUTH ==========
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { pin: string }) => z.object({ pin: z.string().regex(/^\d{4}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin.from("admin_pin").select("pin_hash").eq("id", 1).maybeSingle();
    if (!row || row.pin_hash !== sha256(data.pin)) {
      throw new Error("Code PIN incorrect");
    }
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(); // 8h
    await supabaseAdmin.from("admin_sessions").insert({ token, expires_at: expires });
    // Cleanup expired
    await supabaseAdmin.from("admin_sessions").delete().lt("expires_at", new Date().toISOString());
    return { token, expires_at: expires };
  });

export const adminLogout = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await supabaseAdmin.from("admin_sessions").delete().eq("token", data.token);
    return { ok: true };
  });

export const adminVerify = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    try {
      await requireAdmin(data.token);
      return { valid: true };
    } catch {
      return { valid: false };
    }
  });

export const adminChangePin = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; newPin: string }) =>
    z.object({ token: z.string(), newPin: z.string().regex(/^\d{4}$/) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    await supabaseAdmin.from("admin_pin").update({ pin_hash: sha256(data.newPin), updated_at: new Date().toISOString() }).eq("id", 1);
    return { ok: true };
  });

// ========== ORDERS ==========
export const adminListOrders = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const { data: orders } = await supabaseAdmin
      .from("orders").select("*").order("created_at", { ascending: false }).limit(500);
    return { orders: orders ?? [] };
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string; status: string }) =>
    z.object({
      token: z.string(),
      id: z.string().uuid(),
      status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
    }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    await supabaseAdmin.from("orders").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });

// ========== GENERIC UPSERT/DELETE ==========
const ALLOWED_TABLES = ["categories", "product_types", "products", "slider_images", "about_content", "settings"] as const;
type AllowedTable = typeof ALLOWED_TABLES[number];

export const adminUpsert = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; table: string; row: Record<string, unknown> }) =>
    z.object({
      token: z.string(),
      table: z.enum(ALLOWED_TABLES),
      row: z.record(z.string(), z.any()),
    }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const table = data.table as AllowedTable;
    // settings uses key as PK
    const onConflict = table === "settings" ? "key" : "id";
    const { data: result, error } = await supabaseAdmin
      .from(table)
      .upsert(data.row as never, { onConflict })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { row: result };
  });

export const adminDelete = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; table: string; id: string }) =>
    z.object({
      token: z.string(),
      table: z.enum(ALLOWED_TABLES),
      id: z.string(),
    }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const col = data.table === "settings" ? "key" : "id";
    const { error } = await supabaseAdmin.from(data.table as AllowedTable).delete().eq(col, data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ========== ADMIN LIST (includes inactive) ==========
export const adminListAll = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; table: string }) =>
    z.object({
      token: z.string(),
      table: z.enum([...ALLOWED_TABLES, "orders"] as const),
    }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const { data: rows, error } = await supabaseAdmin
      .from(data.table as AllowedTable | "orders")
      .select("*")
      .order(data.table === "settings" ? "key" : "created_at", { ascending: data.table === "settings" });
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

// ========== STORAGE UPLOAD ==========
export const adminUploadImage = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; filename: string; contentType: string; base64: string; folder?: string }) =>
    z.object({
      token: z.string(),
      filename: z.string().min(1).max(200),
      contentType: z.string().regex(/^image\//),
      base64: z.string(),
      folder: z.string().optional(),
    }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const buf = Buffer.from(data.base64, "base64");
    const folder = data.folder ?? "uploads";
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}-${safeName}`;
    const { error } = await supabaseAdmin.storage.from("public-assets").upload(path, buf, {
      contentType: data.contentType,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data: pub } = supabaseAdmin.storage.from("public-assets").getPublicUrl(path);
    return { url: pub.publicUrl, path };
  });
