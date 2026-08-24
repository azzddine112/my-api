const express = require('express');
const cors = require('cors');
const twitterGetUrl = require('twitter-url-direct');

const app = express();
app.use(cors());
app.use(express.json());

// مسار رئيسي لفحص سلامة السيرفر من المتصفح و UptimeRobot
app.get('/', (req, res) => {
    res.status(200).send('API Server is Running Perfectly!');
});

app.get('/api/extract', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ success: false, message: 'الرابط مطلوب' });
    }

    try {
        // استخراج روابط تويتر مباشرة وبشكل موثوق
        let result = await twitterGetUrl(videoUrl);

        if (result && result.found && result.download && result.download.length > 0) {
            // اختيار الجودة الأعلى المتاحة
            const highestQuality = result.download[result.download.length - 1];

            return res.json({
                success: true,
                video_url: highestQuality.url,
                thumbnail: result.dimensions || ''
            });
        }

        res.status(400).json({ success: false, message: 'تعذر جلب الفيديو، تأكد من صحة رابط التغريدة' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في معالجة الرابط' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
