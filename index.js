const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('API Engine Active'));

const handleExtraction = async (req, res) => {
    let url = req.query.url || (req.body && req.body.url);
    if (!url) return res.status(400).json({ success: false, message: 'الرابط مطلوب' });

    // --- 1. إنستغرام Instagram ---
    if (url.includes("instagram.com") || url.includes("instagr.am")) {
        try {
            const cleanUrl = url.split('?')[0].replace(/\/$/, "");

            const response = await axios.get(`https://a2z-api.vercel.app/api/instagram?url=${encodeURIComponent(cleanUrl)}`, {
                timeout: 12000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (response.data) {
                const data = response.data;
                let videoUrl = "";
                let thumbUrl = "";

                if (data.url) {
                    videoUrl = Array.isArray(data.url) ? data.url[0] : data.url;
                } else if (data.data && data.data.video_url) {
                    videoUrl = data.data.video_url;
                }

                thumbUrl = data.thumb || data.thumbnail || (data.data ? data.data.thumbnail : "");

                if (videoUrl) {
                    return res.json({
                        success: true,
                        video_url: videoUrl,
                        thumbnail: thumbUrl
                    });
                }
            }
        } catch (e) {
            console.error("Instagram Extractor Error:", e.message);
        }
    }

    // --- 2. تويتر / X ---
    if (url.includes("twitter.com") || url.includes("x.com")) {
        try {
            const match = url.match(/status\/(\d+)/);
            if (match) {
                const response = await axios.get(`https://api.fxtwitter.com/status/${match[1]}`, {
                    timeout: 10000
                });
                if (response.data && response.data.tweet) {
                    const tweet = response.data.tweet;
                    if (tweet.media && tweet.media.videos) {
                        return res.json({
                            success: true,
                            video_url: tweet.media.videos[0].url,
                            thumbnail: tweet.media.photos ? tweet.media.photos[0]?.url : ''
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Twitter Error:", e.message);
        }
    }

    return res.status(400).json({ 
        success: false, 
        message: 'تعذر استخراج الفيديو، تأكد من صحة الرابط وأن الحساب عام' 
    });
};

app.get('/api/extract', handleExtraction);
app.post('/api/extract', handleExtraction);
app.get('/api/download', handleExtraction);
app.post('/api/download', handleExtraction);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
