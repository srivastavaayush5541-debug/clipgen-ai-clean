// backend/utils/video.js - AI Video Generation Pipeline
const fs = require('fs-extra');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Replicate = require('replicate');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

async function generateVideo(topic, duration = 30, jobId) {
  try {
    const tempDir = path.join(__dirname, '../temp', jobId);
    await fs.ensureDir(tempDir);

    console.log(`🎬 Starting video pipeline for "${topic}" (Job: ${jobId})`);

    // 1. Generate script with Gemini
    const script = await generateScript(topic);
    await fs.writeFile(path.join(tempDir, 'script.txt'), script);
    
    // 2. Generate voiceover
    const audioPath = await generateVoiceover(script, path.join(tempDir, 'voice.mp3'));
    
    // 3. Generate images for key scenes
    const images = await generateImages(script, tempDir);
    
    // 4. Create video with images + voiceover
    const videoPath = await createVideo(images, audioPath, duration, path.join(tempDir, 'output.mp4'));
    
    console.log(`✅ Video generated: ${videoPath}`);
    return { success: true, videoPath };
    
  } catch (error) {
    console.error(`❌ Video generation failed for ${jobId}:`, error);
    throw error;
  }
}

async function generateScript(topic) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `Create a engaging 30-second video script for topic: "${topic}"

Requirements:
- Conversational tone
- 100-150 words
- Clear structure: Hook → 2-3 main points → CTA
- Perfect for B-roll video with voiceover
- Numbered scenes for image generation

Format:
SCENE 1: [description]
[dialogue...]

Return ONLY the script.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateVoiceover(script, outputPath) {
  // Using Google TTS via gtts or similar
  const { GoogleTTS } = require('google-tts-api');
  
  const audioBuffer = GoogleTTS(script, 'en', 1);
  await fs.writeFile(outputPath, audioBuffer);
  
  return outputPath;
}

async function generateImages(script, tempDir) {
  const images = [];
  
  // Extract 5-8 key scenes from script
  const scenes = script.match(/SCENE \d+:/gi) || 5;
  
  for (let i = 0; i < Math.min(scenes.length, 8); i++) {
    const scenePrompt = `Cinematic B-roll image for video scene ${i + 1}, highly detailed, 16:9 aspect ratio, vibrant colors, professional lighting`;
    
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: 'stability-ai/stable-diffusion-xl-base-1.0',
        input: { prompt: scenePrompt }
      },
      { headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` } }
    );
    
    // Wait for image generation (poll prediction)
    // ... implementation
    
    const imagePath = path.join(tempDir, `scene_${i}.jpg`);
    images.push(imagePath);
  }
  
  return images;
}

async function createVideo(images, audioPath, duration, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(images[0]) // First image
      .inputOptions('-loop 1')
      .input(audioPath)
      .outputOptions([
        '-c:v libx264',
        '-tune stillimage',
        '-vf fps=1/5', // 5 second per image
        '-pix_fmt yuv420p',
        '-shortest'
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

module.exports = { generateVideo };

