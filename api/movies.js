// API endpoint for movies CRUD operations
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.COCKROACHDB_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res);
        break;
      case 'POST':
        await handleCreate(req, res);
        break;
      case 'PUT':
        await handleUpdate(req, res);
        break;
      case 'DELETE':
        await handleDelete(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Movies API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// GET - Fetch movies
async function handleGet(req, res) {
  try {
    const { id } = req.query;
    
    if (id) {
      // Get specific movie by ID
      const result = await pool.query(
        'SELECT * FROM movies WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Movie not found' });
      }
      
      res.status(200).json(result.rows[0]);
    } else {
      // Get all movies
      const result = await pool.query(
        'SELECT * FROM movies ORDER BY views DESC, year DESC, created_at DESC'
      );
      res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
}

// POST - Create new movie
async function handleCreate(req, res) {
  try {
    const { youtube_url, description } = req.body;
    
    // Validate required fields
    if (!youtube_url) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'YouTube URL is required'
      });
    }
    
    // Extract YouTube video ID from URL
    const youtubeId = extractYouTubeId(youtube_url);
    if (!youtubeId) {
      return res.status(400).json({
        error: 'Invalid YouTube URL',
        details: 'Please provide a valid YouTube video URL'
      });
    }
    
    // Fetch video details from YouTube
    const videoDetails = await fetchYouTubeVideoDetails(youtubeId);
    if (!videoDetails) {
      return res.status(400).json({
        error: 'Failed to fetch video details',
        details: 'Could not retrieve video information from YouTube'
      });
    }
    
    const { title, year } = videoDetails;
    
    // Check if movie already exists
    const existingMovie = await pool.query(
      'SELECT id FROM movies WHERE youtube_id = $1',
      [youtubeId]
    );
    
    if (existingMovie.rows.length > 0) {
      return res.status(400).json({
        error: 'Movie already exists',
        details: 'A movie with this YouTube video already exists'
      });
    }
    
    // Create movie
    const result = await pool.query(
      `INSERT INTO movies (title, year, youtube_id, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [title, year, youtubeId, description || '']
    );
    
    res.status(201).json({
      success: true,
      message: 'Movie created successfully!',
      movie: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating movie:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to create movie',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// PUT - Update movie
async function handleUpdate(req, res) {
  try {
    const { id } = req.query;
    const { youtube_url, description } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Movie ID required' });
    }
    
    // Check if movie exists
    const existingMovie = await pool.query('SELECT id FROM movies WHERE id = $1', [id]);
    if (existingMovie.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    let title = null;
    let year = null;
    let youtubeId = null;
    
    // Extract YouTube video ID and fetch details if URL provided
    if (youtube_url) {
      youtubeId = extractYouTubeId(youtube_url);
      if (!youtubeId) {
        return res.status(400).json({
          error: 'Invalid YouTube URL',
          details: 'Please provide a valid YouTube video URL'
        });
      }
      
      // Fetch video details from YouTube
      const videoDetails = await fetchYouTubeVideoDetails(youtubeId);
      if (!videoDetails) {
        return res.status(400).json({
          error: 'Failed to fetch video details',
          details: 'Could not retrieve video information from YouTube'
        });
      }
      
      title = videoDetails.title;
      year = videoDetails.year;
    }
    
    // Update movie
    const result = await pool.query(
      `UPDATE movies 
       SET title = COALESCE($1, title),
           year = COALESCE($2, year),
           youtube_id = COALESCE($3, youtube_id),
           description = COALESCE($4, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, year, youtubeId, description, id]
    );
    
    res.status(200).json({
      success: true,
      message: 'Movie updated successfully!',
      movie: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update movie',
      details: error.message
    });
  }
}

// DELETE - Delete movie
async function handleDelete(req, res) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Movie ID required' });
    }
    
    // Check if movie exists
    const existingMovie = await pool.query('SELECT id FROM movies WHERE id = $1', [id]);
    if (existingMovie.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    // Delete movie
    await pool.query('DELETE FROM movies WHERE id = $1', [id]);
    
    res.status(200).json({
      success: true,
      message: 'Movie deleted successfully!'
    });
    
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete movie',
      details: error.message
    });
  }
}

// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Fetch video details from YouTube
async function fetchYouTubeVideoDetails(videoId) {
  try {
    // Use YouTube's oEmbed API to get video details
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      console.error('YouTube oEmbed API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    // Extract title from the response
    const title = data.title;
    
    // Try to extract year from title (common pattern: "Movie Name (2023)")
    let year = null;
    const yearMatch = title.match(/\((\d{4})\)/);
    if (yearMatch) {
      year = parseInt(yearMatch[1]);
    } else {
      // If no year in title, use current year as fallback
      year = new Date().getFullYear();
    }
    
    return { title, year };
    
  } catch (error) {
    console.error('Error fetching YouTube video details:', error);
    return null;
  }
} 