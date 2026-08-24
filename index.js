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
    let videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ success: false, message: 'الرابط مطلوب' });
    }

    // تنظيف الرابط من المعلمات الزائدة مثل ?s=20
    if (videoUrl.includes('?')) {
        videoUrl = videoUrl.split('?')[0];
    }

    try {
        const match = videoUrl.match(/status\/(\d+)/);
        if (!match) {
            return res.status(400).json({ success: false, message: 'رابط التغريدة غير صالح' });
        }
        const tweetId = match[1];

        // استخدام واجهة FxTwitter الموثوقة جداً
        const response = await axios.get(`https://api.fxtwitter.com/status/${tweetId}`, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const tweet = response.data.tweet;

        if (tweet && tweet.media && tweet.media.videos && tweet.media.videos.length > 0) {
            const video = tweet.media.videos[0];
            return res.json({
                success: true,
                video_url: video.url,
                thumbnail: tweet.media.photos && tweet.media.photos[0] ? tweet.media.photos[0].url : ''
            });
        }

        res.status(400).json({ success: false, message: 'لا يوجد فيديو في هذه التغريدة' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'تعذر جلب الفيديو، حاول لاحقاً' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
