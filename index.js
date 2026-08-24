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
        // استخراج Tweet ID سواء كان الرابط من twitter.com أو x.com
        const match = videoUrl.match(/status\/(\d+)/);
        if (!match) {
            return res.status(400).json({ success: false, message: 'رابط التغريدة غير صالح' });
        }
        const tweetId = match[1];

        // الاتصال بـ API الميديا المباشر
        const response = await axios.get(`https://api.vxtwitter.com/Twitter/status/${tweetId}`, {
            timeout: 12000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        const data = response.data;

        if (data && data.media_urls && data.media_urls.length > 0) {
            // البحث عن فيديو MP4 أولوياً
            const video = data.media_urls.find(u => u.includes('.mp4') || u.includes('video'));
            const finalMedia = video || data.media_urls[0];

            return res.json({
                success: true,
                video_url: finalMedia,
                thumbnail: data.mediaDetails && data.mediaDetails[0] ? data.mediaDetails[0].thumbnail_url : '',
                title: data.text || 'X Video'
            });
        }

        res.status(400).json({ success: false, message: 'التغريدة لا تحتوي على وسائط قابلة للتحميل' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ أثناء الاتصال بالخدمة' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
