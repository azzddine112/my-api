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
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ success: false, message: 'الرابط مطلوب' });
    }

    try {
        // المحاولة الأولى: استخدام محرك Cobalt المباشر
        const cobaltResponse = await axios.post('https://api.cobalt.tools/api/json', {
            url: videoUrl,
            videoQuality: '720'
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            timeout: 10000
        });

        const cData = cobaltResponse.data;

        if (cData.status === 'stream' || cData.status === 'redirect') {
            return res.json({
                success: true,
                video_url: cData.url,
                thumbnail: ''
            });
        } else if (cData.status === 'picker' && cData.picker && cData.picker.length > 0) {
            return res.json({
                success: true,
                video_url: cData.picker[0].url,
                thumbnail: cData.picker[0].thumb || ''
            });
        }
    } catch (e) {
        // في حال تعذر المحاولة الأولى يتم الانتقال للمحاولة الاحتياطية تلقائياً
    }

    try {
        // المحاولة الثانية الاحتياطية (VxTwitter)
        const match = videoUrl.match(/status\/(\d+)/);
        if (match) {
            const tweetId = match[1];
            const response = await axios.get(`https://api.vxtwitter.com/Twitter/status/${tweetId}`, { timeout: 8000 });
            const data = response.data;

            if (data && data.media_urls && data.media_urls.length > 0) {
                const video = data.media_urls.find(u => u.includes('.mp4') || u.includes('video')) || data.media_urls[0];
                return res.json({
                    success: true,
                    video_url: video,
                    thumbnail: data.mediaDetails && data.mediaDetails[0] ? data.mediaDetails[0].thumbnail_url : ''
                });
            }
        }
    } catch (err) {}

    res.status(400).json({ success: false, message: 'تعذر جلب الفيديو، تأكد من وجود فيديو في التغريدة' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
