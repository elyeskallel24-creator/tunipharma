import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const contactMethod = z.enum(["phone", "whatsapp"]);

export const submitOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      customer_name: z.string().trim().min(1).max(200),
      customer_phone: z.string().trim().min(4).max(40),
      contact_method: contactMethod,
      wilaya: z.string().trim().min(1).max(80),
      address: z.string().trim().min(1).max(500),
      items: z.array(z.object({
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number().int().min(1),
      })).min(1).max(50),
      subtotal: z.number().min(0),
      delivery_fee: z.number().min(0),
      total: z.number().min(0),
    }).parse(d))
  .handler(async ({ data }) => {
    const { error, data: row } = await supabaseAdmin.from("orders").insert({
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      contact_method: data.contact_method,
      wilaya: data.wilaya,
      address: data.address,
      city: data.wilaya,
      items: data.items,
      subtotal: data.subtotal,
      delivery_fee: data.delivery_fee,
      total: data.total,
    }).select("order_number").single();
    if (error) throw new Error(error.message);
    return { order_number: row?.order_number };
  });

export const submitPrescriptionOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      customer_name: z.string().trim().min(1).max(200),
      customer_phone: z.string().trim().min(4).max(40),
      contact_method: contactMethod,
      wilaya: z.string().trim().min(1).max(80),
      address: z.string().trim().min(1).max(500),
      prescription_images: z.array(z.string().url()).min(1).max(6),
    }).parse(d))
  .handler(async ({ data }) => {
    const { error, data: row } = await supabaseAdmin.from("prescription_orders").insert({
      ...data,
    }).select("order_number").single();
    if (error) throw new Error(error.message);
    return { order_number: row?.order_number };
  });

export const uploadPrescriptionImage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      filename: z.string().min(1).max(200),
      contentType: z.string().regex(/^image\//),
      base64: z.string().min(1).max(8_000_000), // ~6MB encoded
    }).parse(d))
  .handler(async ({ data }) => {
    const buf = Buffer.from(data.base64, "base64");
    if (buf.byteLength > 5 * 1024 * 1024) throw new Error("Image trop volumineuse (max 5 Mo)");
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `prescriptions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { error } = await supabaseAdmin.storage.from("public-assets").upload(path, buf, {
      contentType: data.contentType, upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data: pub } = supabaseAdmin.storage.from("public-assets").getPublicUrl(path);
    return { url: pub.publicUrl };
  });
