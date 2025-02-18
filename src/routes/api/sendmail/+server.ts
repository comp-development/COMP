import { json } from '@sveltejs/kit';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY);

export async function POST({ request }) {
  try {
    const { email, subject, message } = await request.json();

    const msg = {
      to: email,
      from: 'admin@comp.mt',
      subject: subject,
      html: message
    };

    await sgMail.send(msg);

    return json({ success: true, message: 'Email sent successfully', error: null });
  } catch (error) {
    return json({ success: false, message: 'Error sending email', error: error }, { status: 500 });
  }
}
