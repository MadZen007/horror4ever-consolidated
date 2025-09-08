const { pool } = require("./db");

// Generate a secure, unique game link
function generateGameLink(contestId, email) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const hash = Buffer.from(`${contestId}-${email}-${timestamp}-${randomString}`).toString('base64');
  return hash.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

module.exports = async function handler(req, res) {
  console.log('=== CONTEST REGISTRATIONS API STARTED ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  console.log('Environment check - COCKROACHDB_CONNECTION_STRING exists:', !!process.env.COCKROACHDB_CONNECTION_STRING);
  
  try {
    if (req.method === 'GET') {
      // Get all registrations
      const result = await pool.query('SELECT * FROM contest_registrations ORDER BY date DESC');
      return res.status(200).json(result.rows);
    }
    
    if (req.method === 'POST') {
      // Add new registration
      const { fullName, email, screenName, contestId } = req.body;
      
      if (!fullName || !email || !screenName || !contestId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const newRegistration = {
        id: contestId,
        date: new Date().toISOString(),
        fullName,
        email,
        screenName,
        status: 'pending',
        gameLink: null,
        gameLinkSent: false,
        gameLinkSentDate: null,
        gamePlayed: false,
        gamePlayedDate: null,
        score: null,
        questionsAnswered: 0,
        totalQuestions: 500
      };
      
      const result = await pool.query(
        `INSERT INTO contest_registrations 
         (id, date, full_name, email, screen_name, status, game_link, game_link_sent, 
          game_link_sent_date, game_played, game_played_date, score, questions_answered, total_questions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          newRegistration.id,
          newRegistration.date,
          newRegistration.fullName,
          newRegistration.email,
          newRegistration.screenName,
          newRegistration.status,
          newRegistration.gameLink,
          newRegistration.gameLinkSent,
          newRegistration.gameLinkSentDate,
          newRegistration.gamePlayed,
          newRegistration.gamePlayedDate,
          newRegistration.score,
          newRegistration.questionsAnswered,
          newRegistration.totalQuestions
        ]
      );
      
      return res.status(200).json({ 
        success: true, 
        registration: result.rows[0] 
      });
    }
    
    if (req.method === 'PUT') {
      // Update registration status
      const { contestId, status } = req.body;
      
      if (!contestId || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const result = await pool.query(
        'UPDATE contest_registrations SET status = $1 WHERE id = $2 RETURNING *',
        [status, contestId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found' });
      }
      
      return res.status(200).json({ 
        success: true, 
        registration: result.rows[0] 
      });
    }
    
    if (req.method === 'DELETE') {
      // Delete registration
      const { contestId } = req.body;
      
      if (!contestId) {
        return res.status(400).json({ error: 'Missing contest ID' });
      }
      
      const result = await pool.query(
        'DELETE FROM contest_registrations WHERE id = $1 RETURNING *',
        [contestId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found' });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Registration deleted' 
      });
    }

    if (req.method === 'PATCH') {
      // Handle game link operations
      const { contestId, action, score, questionsAnswered } = req.body;
      
      if (!contestId || !action) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      let updateQuery = '';
      let queryParams = [contestId];
      
      switch (action) {
        case 'generate_link':
          const gameLink = generateGameLink(contestId, 'temp-email'); // We'll get email from DB
          updateQuery = 'UPDATE contest_registrations SET game_link = $2, game_link_sent = false, game_link_sent_date = null WHERE id = $1 RETURNING *';
          queryParams.push(gameLink);
          break;
          
        case 'mark_link_sent':
          updateQuery = 'UPDATE contest_registrations SET game_link_sent = true, game_link_sent_date = $2 WHERE id = $1 RETURNING *';
          queryParams.push(new Date().toISOString());
          break;
          
        case 'mark_game_played':
          updateQuery = 'UPDATE contest_registrations SET game_played = true, game_played_date = $2, score = $3, questions_answered = $4 WHERE id = $1 RETURNING *';
          queryParams.push(new Date().toISOString(), score || 0, questionsAnswered || 0);
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
      
      const result = await pool.query(updateQuery, queryParams);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found' });
      }
      
      return res.status(200).json({ 
        success: true, 
        registration: result.rows[0] 
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('=== CONTEST REGISTRATIONS API ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    return res.status(500).json({ error: 'Database error occurred', details: error.message });
  }
}
