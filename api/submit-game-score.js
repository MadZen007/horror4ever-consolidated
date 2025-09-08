module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gameLink, score, questionsAnswered } = req.body;
    
    if (!gameLink || score === undefined) {
      return res.status(400).json({ error: 'Game link and score are required' });
    }

    // First, find the registration that has this game link
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const registrationsResponse = await fetch(`${baseUrl}/api/contest-registrations`, {
      method: 'GET'
    });

    if (!registrationsResponse.ok) {
      throw new Error('Failed to fetch registrations');
    }

    const registrationsData = await registrationsResponse.json();
    const registrations = registrationsData.registrations || [];
    
    const registration = registrations.find(r => r.gameLink === gameLink);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found for this game link' });
    }

    // Update the registration with the game results
    const updateResponse = await fetch(`${baseUrl}/api/contest-registrations`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contestId: registration.id,
        action: 'mark_game_played',
        score: parseInt(score),
        questionsAnswered: parseInt(questionsAnswered) || 0
      })
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update registration');
    }

    const result = await updateResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Game score submitted successfully',
      score: score,
      questionsAnswered: questionsAnswered
    });

  } catch (error) {
    console.error('Submit game score error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
