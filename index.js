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

    // --- 2. معالجة روابط ريديت Reddit (عبر جلب ملف JSON المباشر) ---
    if (url.includes("reddit.com") || url.includes("redd.it")) {
        try {
            // فك التوجيه للرابط المختصر أولاً
            let targetUrl = url;
            if (targetUrl.includes('?')) targetUrl = targetUrl.split('?')[0];
            
            const headRes = await axios.get(targetUrl, {
                maxRedirects: 5,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                timeout: 10000
            });
            
            let finalUrl = headRes.request.res.responseUrl || targetUrl;
            if (finalUrl.includes('?')) finalUrl = finalUrl.split('?')[0];
            if (finalUrl.endsWith('/')) finalUrl = finalUrl.slice(0, -1);

            const jsonRes = await axios.get(`${finalUrl}.json`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                timeout: 10000
            });

            const postData = jsonRes.data[0].data.children[0].data;
            let videoUrl = "";
            let thumb = postData.thumbnail || "";

            if (postData.secure_media && postData.secure_media.reddit_video) {
                videoUrl = postData.secure_media.reddit_video.fallback_url;
            } else if (postData.preview && postData.preview.reddit_video_preview) {
                videoUrl = postData.preview.reddit_video_preview.fallback_url;
            }

            if (videoUrl) {
                return res.json({
                    success: true,
                    video_url: videoUrl,
                    thumbnail: thumb
                });
            }
        } catch (e) {}
    }

    res.status(400).json({ success: false, message: 'تعذر جلب الفيديو، تأكد من صحة الرابط وأن المنشور يحتوي على فيديو عام' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
