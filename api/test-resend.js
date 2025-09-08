const { Resend } = require('resend');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if API key exists
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key missing', 
        message: 'RESEND_API_KEY environment variable is not set',
        hasApiKey: false
      });
    }

    // Try to initialize Resend
    const resend = new Resend(apiKey);
    
    // Try a simple email send
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['test@example.com'],
      subject: 'Test Email from Horror4Ever',
      html: '<p>This is a test email to verify Resend is working.</p>',
    });

    if (error) {
      return res.status(500).json({ 
        error: 'Resend API error', 
        details: error,
        hasApiKey: true
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Test email sent successfully',
      data: data,
      hasApiKey: true
    });

  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      stack: error.stack,
      hasApiKey: !!process.env.RESEND_API_KEY
    });
  }
}
