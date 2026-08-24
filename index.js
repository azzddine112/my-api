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

    // --- 2. معالجة روابط الفيسبوك و Reels و Share ---
    if (url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com") || url.includes("share") || url.includes("reel")) {
        try {
            // تتبع إعادة التوجيه لفك روابط share/v/
            const headResp = await axios.get(url, {
                maxRedirects: 5,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 8000
            }).catch(e => e.response);

            let finalUrl = url;
            if (headResp && headResp.request && headResp.request.res && headResp.request.res.responseUrl) {
                finalUrl = headResp.request.res.responseUrl;
            }

            // المحاولة الأولى (Rapid Snapsave Engine)
            const response = await axios.post('https://sssbiz.com/api/download', 
                `url=${encodeURIComponent(finalUrl)}`, 
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    },
                    timeout: 12000
                }
            );

            const fbData = response.data;
            if (fbData && fbData.links && fbData.links.length > 0) {
                return res.json({
                    success: true,
                    video_url: fbData.links[0].url,
                    thumbnail: fbData.thumb || ''
                });
            }
        } catch (e) {}

        // المحاولة الثانية الاحتياطية (Cobalt Engine)
        try {
            const cobalt = await axios.post('https://api.cobalt.tools/api/json', {
                url: url,
                videoQuality: '720'
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                },
                timeout: 10000
            });

            if (cobalt.data && (cobalt.data.status === 'stream' || cobalt.data.status === 'redirect')) {
                return res.json({
                    success: true,
                    video_url: cobalt.data.url,
                    thumbnail: ''
                });
            }
        } catch (e) {}
    }

    res.status(400).json({ success: false, message: 'تعذر جلب الفيديو، تأكد من صحة الرابط وأن المنشور عام' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
