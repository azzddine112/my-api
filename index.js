const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('API Server is Running!');
});

app.get('/api/extract', async (req, res) => {
    let url = req.query.url || req.query.videoUrl;
    if (!url) {
        return res.status(400).json({ success: false, message: 'الرابط مطلوب' });
    }

    // --- تويتر / X ---
    if (url.includes("twitter.com") || url.includes("x.com")) {
        try {
            const match = url.match(/status\/(\d+)/);
            if (match) {
                const tweetId = match[1];
                // استخدام api.vxtwitter المباشر والسريع
                const response = await axios.get(`https://api.vxtwitter.com/Twitter/status/${tweetId}`, {
                    timeout: 15000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                const data = response.data;
                if (data && data.media_extended && data.media_extended.length > 0) {
                    const media = data.media_extended[0];
                    if (media.type === 'video' || media.url) {
                        return res.json({
                            success: true,
                            video_url: media.url,
                            thumbnail: media.thumbnail_url || ""
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Twitter Error:", e.message);
        }
    }

    res.status(400).json({ success: false, message: 'تعذر استخراج الفيديو' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
