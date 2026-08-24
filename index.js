const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/extract', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ success: false, message: 'الرابط مطلوب' });
    }

    try {
        const response = await fetch('https://co.wuk.sh/api/json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            body: JSON.stringify({
                url: videoUrl,
                vQuality: '720'
            })
        });

        const data = await response.json();

        if (data.status === 'stream' || data.status === 'redirect') {
            return res.json({
                success: true,
                video_url: data.url,
                thumbnail: ''
            });
        } else if (data.status === 'picker' && data.picker && data.picker.length > 0) {
            return res.json({
                success: true,
                video_url: data.picker[0].url,
                thumbnail: data.picker[0].thumb || ''
            });
        }

        res.status(500).json({ success: false, message: 'تعذر جلب الفيديو' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الاتصال بالسيرفر' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
