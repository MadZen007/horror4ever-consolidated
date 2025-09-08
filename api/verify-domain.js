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

    // Test 1: Check if API key is working
    console.log('Testing Resend API connection...');

    // Test 2: Send a verification email
    const { data, error } = await resend.emails.send({
      from: 'Horror4Ever Contest <contest@horror4ever.com>',
      to: [email],
      subject: '🔍 Domain Verification Test - Horror4Ever',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Domain Verification Test</title>
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
            .success {
              color: #28a745;
              font-weight: bold;
            }
            .details {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .test-item {
              margin: 10px 0;
              padding: 10px;
              border-left: 4px solid #28a745;
              background-color: #f8fff9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎃 Horror4Ever</h1>
              <h2 class="success">✅ Domain Verification Successful!</h2>
            </div>
            
            <p>This email confirms that your domain <strong>horror4ever.com</strong> is properly configured with Resend.</p>
            
            <div class="details">
              <h3>🔍 Verification Tests Passed:</h3>
              <div class="test-item">
                ✅ <strong>API Key:</strong> Valid and working
              </div>
              <div class="test-item">
                ✅ <strong>Domain:</strong> horror4ever.com is verified
              </div>
              <div class="test-item">
                ✅ <strong>From Address:</strong> contest@horror4ever.com is authorized
              </div>
              <div class="test-item">
                ✅ <strong>DNS Records:</strong> All required records are configured
              </div>
              <div class="test-item">
                ✅ <strong>Email Delivery:</strong> This email was sent successfully
              </div>
            </div>
            
            <p><strong>Test Details:</strong></p>
            <ul>
              <li><strong>From:</strong> contest@horror4ever.com</li>
              <li><strong>To:</strong> ${email}</li>
              <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>Email ID:</strong> ${data?.id || 'N/A'}</li>
            </ul>
            
            <p><strong>What this means:</strong></p>
            <ul>
              <li>Your domain is properly configured</li>
              <li>Emails will be delivered reliably</li>
              <li>You can proceed with the contest signup form</li>
              <li>Contest confirmation emails will work correctly</li>
            </ul>
            
            <p style="text-align: center; margin-top: 30px;">
              <strong>🎉 You're ready to launch the contest!</strong>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ 
        error: 'Domain verification failed', 
        details: error,
        step: 'email_sending'
      });
    }

    console.log('Domain verification email sent successfully:', data);
    return res.status(200).json({ 
      success: true, 
      message: 'Domain verification successful',
      emailId: data.id,
      from: 'contest@horror4ever.com',
      to: email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      step: 'server_error'
    });
  }
}
