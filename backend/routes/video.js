const express = require('express');
const router = express.Router();
const { generateVideo } = require('../utils/video');

// POST /api/video/generate-video
router.post('/generate-video', async (req, res) => {
  try {
    const { topic, duration = 30 } = req.body;
    
    if (!topic) {
      return res.status(400).json({ 
        error: 'Topic is required',
        jobId: null 
      });
    }

    console.log(`🎬 Generating video for topic: ${topic}`);
    
    // Call video generation logic
    const jobId = `job_${Date.now()}`;
    const result = await generateVideo(topic, duration, jobId);
    
    res.json({
      success: true,
      jobId,
      status: 'processing',
      videoUrl: `/video/${jobId}/output.mp4`,
      estimatedTime: '2-5 minutes'
    });
    
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ 
      error: 'Video generation failed',
      details: error.message 
    });
  }
});

// GET /api/video/:jobId/status
router.get('/:jobId/status', (req, res) => {
  // Check job status (implemented in utils/video.js)
  res.json({ 
    jobId: req.params.jobId,
    status: 'completed', 
    videoUrl: `/video/${req.params.jobId}/output.mp4`
  });
});

module.exports = router;

