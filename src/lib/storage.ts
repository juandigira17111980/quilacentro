import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads a file to a private bucket and returns a long-lived signed URL
 * (10 years). Buckets in this project are private (workspace policy blocks
 * public buckets), but anonymous reads are allowed via RLS on storage.objects.
 */
export async function uploadAndGetUrl(
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;
  const tenYears = 60 * 60 * 24 * 365 * 10;
  const { data, error: e2 } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, tenYears);
  if (e2 || !data) throw e2 ?? new Error("Failed to create signed URL");
  return data.signedUrl;
}

export function safeFileName(name: string) {
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const base = name
    .slice(0, name.length - ext.length)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "file";
  return `${base}-${Date.now()}${ext.toLowerCase()}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
