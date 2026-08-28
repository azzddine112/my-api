const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { execFile } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('API Engine Active'));

// ---------- المحرك الأساسي: yt-dlp ----------
function extractWithYtDlp(url) {
    return new Promise((resolve, reject) => {
        execFile(
            'yt-dlp',
            ['-f', 'best', '-j', '--no-warnings', '--no-playlist', url],
            { timeout: 25000, maxBuffer: 1024 * 1024 * 20 },
            (error, stdout, stderr) => {
                if (error) return reject(stderr || error.message);
                try {
                    const data = JSON.parse(stdout);
                    const videoUrl = data.url || (data.formats?.length ? data.formats[data.formats.length - 1].url : '');
                    if (!videoUrl) return reject('لا يوجد رابط فيديو في رد yt-dlp');
                    resolve({ video_url: videoUrl, thumbnail: data.thumbnail || '' });
                } catch (e) {
                    reject('فشل تحليل رد yt-dlp: ' + e.message);
                }
            }
        );
    });
}

// ---------- محاولات احتياطية لكل منصة ----------
async function fallbackInstagram(cleanUrl) {
    try {
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
        if (response.data?.data) {
            const html = response.data.data;
            const videoMatch = html.match(/href="(https?:\/\/[^"]+\.mp4[^"]*)"/);
            const thumbMatch = html.match(/src="(https?:\/\/[^"]+\.(jpg|jpeg|webp)[^"]*)"/);
            if (videoMatch) {
                return { video_url: videoMatch[1].replace(/&amp;/g, '&'), thumbnail: thumbMatch ? thumbMatch[1].replace(/&amp;/g, '&') : '' };
            }
        }
    } catch (e) {
        console.error('Instagram fallback error:', e.message);
    }
    return null;
}

async function fallbackTwitter(statusId) {
    try {
        const response = await axios.get(`https://api.fxtwitter.com/status/${statusId}`, { timeout: 10000 });
        const media = response.data?.tweet?.media;
        if (media?.videos?.length > 0) {
            return { video_url: media.videos[0].url, thumbnail: media.photos?.[0]?.url || '' };
        }
    } catch (e) {
        console.error('Twitter fallback error:', e.message);
    }
    return null;
}

async function fallbackPinterest(url) {
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 10000
        });
        const match = response.data.match(/https?:\/\/v1\.pinimg\.com\/videos\/[^"]+?\.mp4/);
        if (match) return { video_url: match[0].replace(/\\\//g, '/'), thumbnail: '' };
    } catch (e) {
        console.error('Pinterest fallback error:', e.message);
    }
    return null;
}

// ---------- المعالج الرئيسي ----------
const handleExtraction = async (req, res) => {
    const rawUrl = req.query.url || (req.body && req.body.url);
    if (!rawUrl) return res.status(400).json({ success: false, message: 'الرابط مطلوب' });

    const cleanUrl = rawUrl.split('?')[0].replace(/\/$/, "");
    const isInstagram = rawUrl.includes('instagram.com') || rawUrl.includes('instagr.am');
    const isTwitter = rawUrl.includes('twitter.com') || rawUrl.includes('x.com');
    const isPinterest = rawUrl.includes('pinterest.com') || rawUrl.includes('pin.it');
    const isTikTok = rawUrl.includes('tiktok.com');
    const isFacebook = rawUrl.includes('facebook.com') || rawUrl.includes('fb.watch') || rawUrl.includes('fb.com');

    if (!isInstagram && !isTwitter && !isPinterest && !isTikTok && !isFacebook) {
        return res.status(400).json({ success: false, message: 'المنصة غير مدعومة' });
    }

    // المحاولة الأولى دائمًا: yt-dlp
    try {
        const result = await extractWithYtDlp(rawUrl);
        return res.json({ success: true, ...result });
    } catch (e) {
        console.error('yt-dlp failed:', e);
    }

    // محاولات احتياطية حسب المنصة
    let fallback = null;
    if (isInstagram) fallback = await fallbackInstagram(cleanUrl);
    else if (isTwitter) {
        const match = rawUrl.match(/status\/(\d+)/);
        if (match) fallback = await fallbackTwitter(match[1]);
    }
    else if (isPinterest) fallback = await fallbackPinterest(rawUrl);

    if (fallback) return res.json({ success: true, ...fallback });

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
