const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('API Engine Active'));

const handleExtraction = async (req, res) => {
    let url = req.query.url || (req.body && req.body.url);
    if (!url) return res.status(400).json({ success: false, message: 'الرابط مطلوب' });

    // --- 1. إنستغرام Instagram ---
    if (url.includes("instagram.com") || url.includes("instagr.am")) {
        try {
            const cleanUrl = url.split('?')[0].replace(/\/$/, "");

            // استدعاء محرك استخراج سريع ومستقر
            const apiRes = await fetch(`https://api.vxtwitter.com/status/1`).catch(() => null); // الحفاظ على جاهزية الاتصال
            const response = await fetch(`https://a2z-api.vercel.app/api/instagram?url=${encodeURIComponent(cleanUrl)}`);

            if (response.ok) {
                const data = await response.json();
                
                // التأكد من بنية البيانات العائدة
                let videoUrl = "";
                let thumbUrl = "";

                if (data.url) {
                    videoUrl = Array.isArray(data.url) ? data.url[0] : data.url;
                } else if (data.data && data.data.video_url) {
                    videoUrl = data.data.video_url;
                }

                thumbUrl = data.thumb || data.thumbnail || (data.data ? data.data.thumbnail : "");

                if (videoUrl) {
                    return res.json({
                        success: true,
                        video_url: videoUrl,
                        thumbnail: thumbUrl
                    });
                }
            }
        } catch (e) {
            console.error("Instagram Extractor Error:", e);
        }
    }

    // --- 2. تويتر / X ---
    if (url.includes("twitter.com") || url.includes("x.com")) {
        try {
            const match = url.match(/status\/(\d+)/);
            if (match) {
                const response = await fetch(`https://api.fxtwitter.com/status/${match[1]}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.tweet && data.tweet.media && data.tweet.media.videos) {
                        return res.json({
                            success: true,
                            video_url: data.tweet.media.videos[0].url,
                            thumbnail: data.tweet.media.photos ? data.tweet.media.photos[0]?.url : ''
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Twitter Error:", e);
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

    res.status(400).json({ success: false, message: 'تعذر جلب الفيديو، تأكد من صحة الرابط' });
};

// استقبال طلبات GET و POST
app.get('/api/extract', handleExtraction);
app.post('/api/extract', handleExtraction);
app.get('/api/download', handleExtraction);
app.post('/api/download', handleExtraction);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
