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

    const cleanUrl = url.split('?')[0].replace(/\/$/, "");

    // --- 1. إنستغرام Instagram ---
    if (url.includes("instagram.com") || url.includes("instagr.am")) {
        try {
            // المحاولة الأولى: عبر محرك SaveIG المباشر
            const response = await axios.post('https://saveig.app/api/ajaxSearch', 
                new URLSearchParams({ q: cleanUrl, t: 'media', lang: 'en' }), 
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    timeout: 10000
                }
            );

            if (response.data && response.data.data) {
                const html = response.data.data;
                const videoMatch = html.match(/href="(https?:\/\/[^"]+\.mp4[^"]*)"/);
                const thumbMatch = html.match(/src="(https?:\/\/[^"]+\.(jpg|jpeg|webp)[^"]*)"/);

                if (videoMatch) {
                    return res.json({
                        success: true,
                        video_url: videoMatch[1].replace(/&amp;/g, '&'),
                        thumbnail: thumbMatch ? thumbMatch[1].replace(/&amp;/g, '&') : ''
                    });
                }
            }

            // المحاولة الثانية: محرك بديل في حال فشل الأول
            const fallbackRes = await axios.get(`https://api.vshred.com/ig?url=${encodeURIComponent(cleanUrl)}`, { timeout: 8000 });
            if (fallbackRes.data && (fallbackRes.data.url || fallbackRes.data.video_url)) {
                return res.json({
                    success: true,
                    video_url: fallbackRes.data.url || fallbackRes.data.video_url,
                    thumbnail: fallbackRes.data.thumb || ''
                });
            }

        } catch (e) {
            console.error("Instagram Error:", e.message);
        }
    }

    // --- 2. تويتر / X ---
    if (url.includes("twitter.com") || url.includes("x.com")) {
        try {
            const match = url.match(/status\/(\d+)/);
            if (match) {
                // المحاولة الأولى: عبر FXTwitter
                const response = await axios.get(`https://api.fxtwitter.com/status/${match[1]}`, { timeout: 10000 });
                if (response.data && response.data.tweet && response.data.tweet.media) {
                    const media = response.data.tweet.media;
                    if (media.videos && media.videos.length > 0) {
                        return res.json({
                            success: true,
                            video_url: media.videos[0].url,
                            thumbnail: media.photos && media.photos[0] ? media.photos[0].url : ''
                        });
                    }
                }

                // المحاولة الثانية: عبر VXTwitter المباشر
                const vxResponse = await axios.get(`https://api.vxtwitter.com/Twitter/status/${match[1]}`, { timeout: 10000 });
                if (vxResponse.data && vxResponse.data.media_urls && vxResponse.data.media_urls.length > 0) {
                    return res.json({
                        success: true,
                        video_url: vxResponse.data.media_urls[0],
                        thumbnail: vxResponse.data.media_extended ? vxResponse.data.media_extended[0].thumbnail_url : ''
                    });
                }
            }
        } catch (e) {
            console.error("Twitter Error:", e.message);
        }
    }

    // --- 3. بنتريست Pinterest ---
    if (url.includes("pinterest.com") || url.includes("pin.it")) {
        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                timeout: 10000
            });
            const html = response.data;
            const match = html.match(/https?:\/\/v1\.pinimg\.com\/videos\/[^\"]+?\.mp4/);
            if (match) {
                return res.json({
                    success: true,
                    video_url: match[0].replace(/\\\//g, "/"),
                    thumbnail: ""
                });
            }
        } catch (e) {
            console.error("Pinterest Error:", e.message);
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
