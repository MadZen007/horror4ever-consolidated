module.exports = async function handler(req, res) {
  try {
    console.log('=== TRIVIA TRACK API STARTED ===');
    console.log('Method:', req.method);
    console.log('Body:', req.body);

    const { action, data } = req.body;

    console.log('Trivia tracking:', { action, data });

    // For now, just log the tracking data
    // You can add database logging here later

    res.status(200).json({
      success: true,
      message: 'Tracking data received',
      action,
      data
    });

  } catch (error) {
    console.error('=== TRIVIA TRACK ERROR ===');
    console.error('Error message:', error && error.message);
    console.error('Error stack:', error && error.stack);
    res.status(500).json({
      error: 'Failed to track trivia data',
      detail: error && error.message
    });
  }
};
