import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { data, error } = await resend.emails.send({
      from: 'Horror4Ever Contest <contest@horror4ever.com>',
      to: [email],
      subject: '🧪 Test Email - Horror4Ever Contest Setup',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email</title>
        </head>
        <body>
          <h1>🎃 Horror4Ever Contest Email Test</h1>
          <p>This is a test email to verify that your Resend email setup is working correctly.</p>
          <p>If you received this email, your email configuration is successful!</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>From: contest@horror4ever.com</li>
            <li>To: ${email}</li>
            <li>Date: ${new Date().toLocaleString()}</li>
          </ul>
          <p>You can now proceed with creating the contest signup form.</p>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send test email', details: error });
    }

    console.log('Test email sent successfully:', data);
    return res.status(200).json({ 
      success: true, 
      message: 'Test email sent successfully',
      emailId: data.id 
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
