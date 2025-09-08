import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, fullName, screenName, contestId } = req.body;

    if (!email || !fullName || !screenName || !contestId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if API key exists
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY environment variable is not set');
      // For now, return success but log the issue
      console.log('Registration received (email disabled):', { email, fullName, screenName, contestId });
      return res.status(200).json({ 
        success: true, 
        message: 'Registration received - email notification disabled due to missing API key',
        warning: 'Please set RESEND_API_KEY in Vercel environment variables'
      });
    }

    // Send notification to admin (using verified sender)
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use Resend's verified sender for testing
      to: ['madzenejk@gmail.com'],
      subject: '🎃 NEW CONTEST REGISTRATION - Payment Verification Required',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contest Confirmation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: #ffffff;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              max-width: 200px;
              height: auto;
            }
            .title {
              color: #FF7518;
              font-size: 24px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .prize {
              color: #FF7518;
              font-size: 32px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .details {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background-color: #FF7518;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎃 Horror4Ever</h1>
            </div>
            
            <div class="title">NEW CONTEST REGISTRATION</div>
            
            <p><strong>Registration Details:</strong></p>
            
            <div class="details">
              <h3>📋 Contestant Information:</h3>
              <ul>
                <li><strong>Full Name:</strong> ${fullName}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Screen Name:</strong> ${screenName}</li>
                <li><strong>Contest ID:</strong> ${contestId}</li>
                <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            
            <p><strong>Action Required:</strong></p>
            <ul>
              <li>Check Ko-fi dashboard for $50 payment from ${email}</li>
              <li>Verify payment amount and timing</li>
              <li>If payment confirmed, send contest confirmation email</li>
              <li>If no payment found, ignore this registration</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://ko-fi.com/manage/sales" class="button">Check Ko-fi Sales</a>
            </div>
            
            <div class="footer">
              <p>This is an automated notification. Please verify payment before confirming contest entry.</p>
              <p>© 2024 Horror4Ever. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    console.log('Email sent successfully:', data);
    return res.status(200).json({ success: true, message: 'Confirmation email sent' });

  } catch (error) {
    console.error('Server error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      env: process.env.RESEND_API_KEY ? 'API key exists' : 'API key missing'
    });
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      hasApiKey: !!process.env.RESEND_API_KEY
    });
  }
}
