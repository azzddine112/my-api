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

    // تنظيف الرابط الأساسي
    const cleanUrl = url.split('?')[0].replace(/\/$/, "");

    try {
        // استدعاء محرك Cobalt الرئيسي لاستخراج الوسائط
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: cleanUrl,
            videoQuality: '720'
        }, {
            timeout: 15000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });

        if (response.data) {
            const data = response.data;
            let videoUrl = "";
            let thumbUrl = "";

            // 1. رابط مباشر للفيديو
            if (data.url) {
                videoUrl = data.url;
                thumbUrl = data.thumb || '';
            } 
            // 2. البوم صور/فيديوهات (Picker)
            else if (data.picker && data.picker.length > 0) {
                videoUrl = data.picker[0].url;
                thumbUrl = data.picker[0].thumb || data.picker[0].url;
            }

            if (videoUrl) {
                return res.json({
                    success: true,
                    video_url: videoUrl,
                    thumbnail: thumbUrl
                });
            }
        }
    } catch (e) {
        console.error("Extraction Error:", e.message);
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
