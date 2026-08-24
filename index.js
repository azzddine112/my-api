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

    // --- 2. معالجة روابط الفيسبوك و Share و Reels ---
    if (url.includes("facebook.com") || url.includes("fb.watch") || url.includes("share") || url.includes("reel")) {
        try {
            // استخدام واجهة Publer لتجاوز حماية الفيسبوك ورابط share/v
            const response = await axios.post('https://publer.io/api/v1/media/download', {
                url: url
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                timeout: 15000
            });

            if (response.data && response.data.payload && response.data.payload.length > 0) {
                const media = response.data.payload[0];
                return res.json({
                    success: true,
                    video_url: media.path || media.url,
                    thumbnail: media.thumbnail || ''
                });
            }
        } catch (e) {}

        // محاولة احتياطية ثانية (FBDown Engine)
        try {
            const response2 = await axios.post('https://fbdownloader.online/api/ajaxSearch', 
                `q=${encodeURIComponent(url)}`, 
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'Mozilla/5.0'
                    },
                    timeout: 12000
                }
            );

            if (response2.data && response2.data.links && response2.data.links.length > 0) {
                return res.json({
                    success: true,
                    video_url: response2.data.links[0].url,
                    thumbnail: response2.data.thumb || ''
                });
            }
        } catch (e) {}
    }

    res.status(400).json({ success: false, message: 'تعذر جلب الفيديو، تأكد من صحة الرابط وأن المنشور عام' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
                    success: true,
                    video_url: cobalt.data.picker[0].url,
                    thumbnail: cobalt.data.picker[0].thumb || ''
                });
            }
        } catch (e) {}
    }

    res.status(400).json({ success: false, message: 'تعذر جلب الفيديو، تأكد من صحة الرابط وأن المنشور عام' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
