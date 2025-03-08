import { json } from '@sveltejs/kit';
import postmark from "postmark";
import { env } from "$env/dynamic/private";

var client = new postmark.ServerClient(env.POSTMARK_API_KEY);

export async function POST({ request }) {
  try {
    const { email, subject, message } = await request.json();

    const msg = {
      To: email,
      From: 'admin@comp.mt',
      Subject: subject,
      HtmlBody: message
    };

    await client.sendEmail(msg);

    return json({ success: true, message: 'Email sent successfully', error: null });
  } catch (error) {
    return json({ success: false, message: 'Error sending email', error: error }, { status: 500 });
  }
}
