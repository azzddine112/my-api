const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('API Engine Active'));

function extractWithYtDlp(url) {
    return new Promise((resolve, reject) => {
        // تحديد المسار المحلي لأداة yt-dlp المحملة داخل bin
        const ytDlpPath = path.join(__dirname, 'bin', 'yt-dlp');

        execFile(
            ytDlpPath,
            ['-f', 'best', '-j', '--no-warnings', '--no-playlist', url],
            { timeout: 30000, maxBuffer: 1024 * 1024 * 20 },
            (error, stdout, stderr) => {
                if (error) {
                    console.error('yt-dlp error:', stderr || error.message);
                    return reject(stderr || error.message);
                }
                try {
                    const data = JSON.parse(stdout);
                    resolve(data);
                } catch (e) {
                    reject('تعذر تحليل رد yt-dlp');
                }
            }
        );
    });
}

const handleExtraction = async (req, res) => {
    const url = req.query.url || (req.body && req.body.url);
    if (!url) return res.status(400).json({ success: false, message: 'الرابط مطلوب' });

    const supported = ['instagram.com', 'instagr.am', 'twitter.com', 'x.com', 'pinterest.com', 'pin.it', 'tiktok.com'];
    if (!supported.some(domain => url.includes(domain))) {
        return res.status(400).json({ success: false, message: 'المنصة غير مدعومة' });
    }

    try {
        const data = await extractWithYtDlp(url);

        const videoUrl = data.url || (data.formats && data.formats.length ? data.formats[data.formats.length - 1].url : '');
        const thumbUrl = data.thumbnail || '';

        if (videoUrl) {
            return res.json({ success: true, video_url: videoUrl, thumbnail: thumbUrl });
        }

        return res.status(400).json({ success: false, message: 'تعذر إيجاد رابط فيديو صالح' });

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: 'تعذر استخراج الفيديو، تأكد من صحة الرابط وأن الحساب عام'
        });
    }
};

app.get('/api/extract', handleExtraction);
app.post('/api/extract', handleExtraction);
app.get('/api/download', handleExtraction);
app.post('/api/download', handleExtraction);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
