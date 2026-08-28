    // --- 1. إنستغرام Instagram ---
    if (url.includes("instagram.com") || url.includes("instagr.am")) {
        try {
            const cleanUrl = url.split('?')[0].replace(/\/$/, "");

            // طلب مباشر وموثوق لاستخراج مقاطع Reel والمنشورات
            const response = await axios.get(`https://api.vshred.com/ig?url=${encodeURIComponent(cleanUrl)}`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                }
            });

            if (response.data) {
                const data = response.data;
                let videoUrl = data.url || data.video_url || (data.data ? data.data.video_url : "");
                let thumbUrl = data.thumb || data.thumbnail || (data.data ? data.data.thumbnail : "");

                if (videoUrl) {
                    return res.json({
                        success: true,
                        video_url: videoUrl,
                        thumbnail: thumbUrl
                    });
                }
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
                // استخدام API المباشر لتويتات X/Twitter
                const response = await axios.get(`https://api.fxtwitter.com/status/${match[1]}`, {
                    timeout: 10000
                });

                if (response.data && response.data.tweet) {
                    const tweet = response.data.tweet;
                    if (tweet.media && tweet.media.videos && tweet.media.videos.length > 0) {
                        return res.json({
                            success: true,
                            video_url: tweet.media.videos[0].url,
                            thumbnail: tweet.media.photos && tweet.media.photos[0] ? tweet.media.photos[0].url : ''
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Twitter Error:", e.message);
        }
    }
