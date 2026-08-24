const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('API Server is Running Perfectly!');
});

app.get('/api/extract', async (req, res) => {
    let url = req.query.url;
    if (!url) {
        return res.status(400).json({ success: false, message: 'الرابط مطلوب' });
    }

    // --- 1. معالجة روابط تويتر / X ---
    if (url.includes("twitter.com") || url.includes("x.com")) {
        try {
            if (url.includes('?')) url = url.split('?')[0];
            const match = url.match(/status\/(\d+)/);
            if (match) {
                const response = await axios.get(`https://api.fxtwitter.com/status/${match[1]}`, {
                    timeout: 10000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const tweet = response.data.tweet;
                if (tweet && tweet.media && tweet.media.videos && tweet.media.videos.length > 0) {
                    return res.json({
                        success: true,
                        video_url: tweet.media.videos[0].url,
                        thumbnail: tweet.media.photos && tweet.media.photos[0] ? tweet.media.photos[0].url : ''
                    });
                }
            }
        } catch (e) {}
    }

    // --- 2. معالجة روابط الفيسبوك و Reels و Share ---
    if (url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com") || url.includes("share") || url.includes("reel")) {
        try {
            const response = await axios.post('https://sssbiz.com/api/download', 
                `url=${encodeURIComponent(url)}`, 
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    },
                    timeout: 12000
                }
            );

            const fbData = response.data;
            if (fbData && fbData.links && fbData.links.length > 0) {
                return res.json({
                    success: true,
                    video_url: fbData.links[0].url,
                    thumbnail: fbData.thumb || ''
                });
            }
        } catch (e) {}
    }

    res.status(400).json({ success: false, message: 'تعذر جلب الفيديو، تأكد من صحة الرابط وأن المنشور عام' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
