import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, playerName, gameLink, contestId } = req.body;
    
    if (!to || !playerName || !gameLink || !contestId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create the game URL with the link parameter
    const gameUrl = `https://trivia.horror4ever.com/index.html?link=${gameLink}`;
    
    // Debug logging
    console.log('Game link email debug:', {
      to,
      playerName,
      gameLink,
      contestId,
      gameUrl,
      vercelUrl: process.env.VERCEL_URL
    });

    // Send game link email
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Using Resend's verified sender
      to: [to],
      subject: '🎃 Your $5000 Horror Trivia Contest Game Link is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF7518; font-size: 2.5em; margin-bottom: 10px;">🎃 HORROR TRIVIA CONTEST 🎃</h1>
            <p style="font-size: 1.2em; color: #cccccc;">Your game link is ready!</p>
          </div>
          
          <div style="background: #2a2a2a; border: 2px solid #FF7518; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
            <h2 style="color: #FF7518; margin-bottom: 15px;">Hello ${playerName}!</h2>
            <p style="font-size: 1.1em; line-height: 1.6; margin-bottom: 20px;">
              Your payment has been verified and your contest entry is confirmed! 
              You're now ready to compete in the $5000 Horror Trivia Contest.
            </p>
            
            <div style="background: #333; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #FF7518; margin-bottom: 15px;">🎯 CONTEST DETAILS</h3>
              <ul style="text-align: left; list-style: none; padding: 0;">
                <li style="margin-bottom: 10px;">✅ <strong>500 Questions</strong> - Test your horror knowledge</li>
                <li style="margin-bottom: 10px;">⏱️ <strong>10 seconds per question</strong> - Speed matters!</li>
                <li style="margin-bottom: 10px;">🏆 <strong>$5000 Prize</strong> - For the ultimate horror master</li>
                <li style="margin-bottom: 10px;">🔗 <strong>One-time use</strong> - Your link is unique and secure</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${gameUrl}" 
                 style="background: linear-gradient(135deg, #FF7518, #FF8C42); 
                        color: #000000; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 10px; 
                        font-size: 1.2em; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(255, 117, 24, 0.3);">
                🎮 START YOUR CONTEST GAME
              </a>
              <p style="margin-top: 15px; color: #cccccc; font-size: 0.9em;">
                If the button doesn't work, copy and paste this link: <br>
                <span style="color: #FF7518; word-break: break-all;">${gameUrl}</span>
              </p>
            </div>
            
            <div style="background: #333; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 0.9em;">
              <p style="margin: 0; color: #cccccc;">
                <strong>Important:</strong> This link can only be used once. Once you start the game, 
                the link becomes invalid. Make sure you have time to complete all 500 questions 
                before clicking the start button.
              </p>
            </div>
          </div>
          
          <div style="background: #2a2a2a; border: 1px solid #444; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #FF7518; margin-bottom: 10px;">📋 CONTEST RULES</h3>
            <ul style="margin: 0; padding-left: 20px; color: #cccccc;">
              <li>You have 10 seconds to answer each question</li>
              <li>Score decreases as time runs out (max 10 points per question)</li>
              <li>You must complete all 500 questions</li>
              <li>Your final score will be recorded for the contest</li>
              <li>Highest score wins the $5000 prize</li>
            </ul>
          </div>
          
          <div style="text-align: center; color: #888; font-size: 0.9em; margin-top: 30px;">
            <p>Contest ID: ${contestId}</p>
            <p>Good luck, horror master! 🎃</p>
            <p>Questions? Contact us at admin@horror4ever.com</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Game link email sent successfully',
      emailId: data?.id 
    });

  } catch (error) {
    console.error('Send game link email error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
