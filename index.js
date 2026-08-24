const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// مسار رئيسي لفحص سلامة السيرفر
app.get('/', (req, res) => {
    res.status(200).send('API Server is Running Perfectly!');
});

app.get('/api/extract', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ success: false, message: 'الرابط مطلوب' });
    }

    try {
        // استخراج معرّف التغريدة (Tweet ID)
        const match = videoUrl.match(/status\/(\d+)/);
        if (!match) {
            return res.status(400).json({ success: false, message: 'رابط التغريدة غير صالحة' });
        }
        const tweetId = match[1];

        // طلب البيانات عبر واجهة API مستقرة ومجانية
        const response = await axios.get(`https://api.vxtwitter.com/Twitter/status/${tweetId}`, {
            timeout: 10000
        });

        const data = response.data;

        if (data && data.media_urls && data.media_urls.length > 0) {
            // تصفية جلب رابط mp4 المباشر
            const video = data.media_urls.find(u => u.includes('.mp4')) || data.media_urls[0];
            
            return res.json({
                success: true,
                video_url: video,
                thumbnail: data.mediaDetails && data.mediaDetails[0] ? data.mediaDetails[0].thumbnail_url : ''
            });
        }

        res.status(400).json({ success: false, message: 'لم يتم العثور على فيديو في التغريدة' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ أثناء جلب فيديو التغريدة' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
