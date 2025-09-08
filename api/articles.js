// API endpoint for articles CRUD operations
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.COCKROACHDB_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
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
    console.error('Articles API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// GET - Fetch articles
async function handleGet(req, res) {
  try {
    const { slug, published } = req.query;
    
    if (slug) {
      // Get specific article by slug (temporarily allow unpublished for debugging)
      const result = await pool.query(
        'SELECT * FROM articles WHERE slug = $1',
        [slug]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Article not found' });
      }
      
      const article = result.rows[0];
      
      // If article exists but isn't published, return it anyway for now
      if (!article.is_published) {
        console.log('Article found but not published:', article.slug);
      }
      
      res.status(200).json(article);
    } else {
      // Get all articles (show both published and unpublished for now)
      const query = 'SELECT * FROM articles ORDER BY date DESC, created_at DESC';
      
      const result = await pool.query(query);
      res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
    console.error('Request query:', req.query);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
}

// POST - Create new article
async function handleCreate(req, res) {
  try {
    const { title, slug, author, date, summary, content, thumbnail, tags, youtube_id } = req.body;
    
    // Validate required fields
    if (!title || !slug || !author || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Title, slug, author, and content are required'
      });
    }
    
    // Check if slug already exists
    const existingArticle = await pool.query(
      'SELECT id FROM articles WHERE slug = $1',
      [slug]
    );
    
    if (existingArticle.rows.length > 0) {
      return res.status(400).json({
        error: 'Slug already exists',
        details: 'An article with this slug already exists'
      });
    }
    
    // Create article
    const result = await pool.query(
      `INSERT INTO articles (title, slug, author, date, summary, content, thumbnail, tags, youtube_id, is_published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [title, slug, author, date || new Date().toISOString().split('T')[0], summary, content, thumbnail || '', tags || [], youtube_id || null, false]
    );
    
    res.status(201).json({
      success: true,
      message: 'Article created successfully!',
      article: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create article',
      details: error.message
    });
  }
}

// PUT - Update article
async function handleUpdate(req, res) {
  try {
    const { id } = req.query;
    const { title, slug, author, date, summary, content, thumbnail, tags, youtube_id, is_published } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Article ID required' });
    }
    
    // Check if article exists
    const existingArticle = await pool.query('SELECT id FROM articles WHERE id = $1', [id]);
    if (existingArticle.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Check if new slug conflicts with other articles
    if (slug) {
      const slugConflict = await pool.query(
        'SELECT id FROM articles WHERE slug = $1 AND id != $2',
        [slug, id]
      );
      
      if (slugConflict.rows.length > 0) {
        return res.status(400).json({
          error: 'Slug already exists',
          details: 'Another article with this slug already exists'
        });
      }
    }
    
    // Update article
    const result = await pool.query(
      `UPDATE articles 
       SET title = COALESCE($1, title),
           slug = COALESCE($2, slug),
           author = COALESCE($3, author),
           date = COALESCE($4, date),
           summary = COALESCE($5, summary),
           content = COALESCE($6, content),
           thumbnail = COALESCE($7, thumbnail),
           tags = COALESCE($8, tags),
           youtube_id = COALESCE($9, youtube_id),
           is_published = COALESCE($10, is_published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [title, slug, author, date, summary, content, thumbnail, tags, youtube_id, is_published, id]
    );
    
    res.status(200).json({
      success: true,
      message: 'Article updated successfully!',
      article: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update article',
      details: error.message
    });
  }
}

// DELETE - Delete article
async function handleDelete(req, res) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Article ID required' });
    }
    
    // Check if article exists
    const existingArticle = await pool.query('SELECT id FROM articles WHERE id = $1', [id]);
    if (existingArticle.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Delete article
    await pool.query('DELETE FROM articles WHERE id = $1', [id]);
    
    res.status(200).json({
      success: true,
      message: 'Article deleted successfully!'
    });
    
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete article',
      details: error.message
    });
  }
} 