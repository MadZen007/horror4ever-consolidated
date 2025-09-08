import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.COCKROACHDB_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create contest_registrations table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS contest_registrations (
        id VARCHAR(255) PRIMARY KEY,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        screen_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        game_link VARCHAR(255),
        game_link_sent BOOLEAN DEFAULT false,
        game_link_sent_date TIMESTAMP WITH TIME ZONE,
        game_played BOOLEAN DEFAULT false,
        game_played_date TIMESTAMP WITH TIME ZONE,
        score INTEGER,
        questions_answered INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 500,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await pool.query(createTableQuery);

    // Create indexes for better performance
    const createIndexesQuery = `
      CREATE INDEX IF NOT EXISTS idx_contest_registrations_status ON contest_registrations(status);
      CREATE INDEX IF NOT EXISTS idx_contest_registrations_email ON contest_registrations(email);
      CREATE INDEX IF NOT EXISTS idx_contest_registrations_date ON contest_registrations(date);
    `;

    await pool.query(createIndexesQuery);

    return res.status(200).json({ 
      success: true, 
      message: 'Contest registrations table created successfully' 
    });

  } catch (error) {
    console.error('Database setup error:', error);
    return res.status(500).json({ 
      error: 'Failed to create contest registrations table',
      details: error.message 
    });
  }
}
