import { json } from '@sveltejs/kit';
import { env } from "$env/dynamic/private";

export async function POST({ request }) {
  try {
    const { host_id, email } = await request.json();

    const encoder = new TextEncoder();
    const data = encoder.encode("" + email + host_id + env.HOST_ID_INVITE_SALT);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashed = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");

    return json({ success: true, error: null, hash: hashed });
  } catch (error) {
    return json({ success: false, error: error }, { status: 500 });
  }
}
