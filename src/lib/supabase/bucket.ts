import { supabase } from "../supabaseClient";

export async function uploadWaiver(pdf: Blob, event_id: number, name: string) {
  // Upload the PDF file to the "waivers" bucket
  const { data, error } = await supabase
    .storage
    .from('waivers')
    .upload(event_id + "/" + name + ".pdf", pdf, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // After uploading, get the public URL of the file
  const { data: publicData } = supabase
    .storage
    .from('waivers')
    .getPublicUrl(event_id + "/" + name + ".pdf");

  // Return the public URL
  return publicData.publicUrl;
}
