const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('API Server is Running!');
});

app.get('/api/extract', async (req, res) => {
    let url = req.query.url || req.query.videoUrl;
    if (!url) {
        return res.status(400).json({ success: false, message: 'الرابط مطلوب' });
    }

    // --- 1. تويتر / X ---
    if (url.includes("twitter.com") || url.includes("x.com")) {
        try {
            if (url.includes('?')) url = url.split('?')[0];
            const match = url.match(/status\/(\d+)/);
            if (match) {
                const response = await fetch(`https://api.fxtwitter.com/status/${match[1]}`);
                if (response.ok) {
                    const data = await response.json();
                    const tweet = data.tweet;
                    if (tweet && tweet.media && tweet.media.videos && tweet.media.videos.length > 0) {
                        return res.json({
                            success: true,
                            video_url: tweet.media.videos[0].url,
                            thumbnail: tweet.media.photos && tweet.media.photos[0] ? tweet.media.photos[0].url : ''
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Twitter Error:", e);
        }
    }

    // --- 2. ريديت Reddit ---
    if (url.includes("reddit.com") || url.includes("redd.it")) {
        try {
            let targetUrl = url.split('?')[0];
            if (targetUrl.endsWith('/')) targetUrl = targetUrl.slice(0, -1);

            const jsonRes = await fetch(`${targetUrl}.json`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (jsonRes.ok) {
                const data = await jsonRes.json();
                const postData = data[0].data.children[0].data;
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
            }
        } catch (e) {
            console.error("Reddit Error:", e);
        }
    }

    res.status(400).json({ success: false, message: 'تعذر جلب الفيديو، تأكد من صحة الرابط وأن المنشور يحتوي على فيديو عام' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
