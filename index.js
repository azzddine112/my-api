    // --- 1. إنستغرام Instagram ---
    if (url.includes("instagram.com") || url.includes("instagr.am")) {
        try {
            const cleanUrl = url.split('?')[0].replace(/\/$/, "");

            const resCobalt = await fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                },
                body: JSON.stringify({
                    url: cleanUrl,
                    videoQuality: '720'
                })
            });

            if (resCobalt.ok) {
                const data = await resCobalt.json();

                // التعامل مع روابط الفيديو المباشرة
                if (data && data.url) {
                    return res.json({
                        success: true,
                        video_url: data.url,
                        thumbnail: data.thumb || ''
                    });
                }

                // التعامل مع المنشورات متعددة الوسائط (Picker/Carousel)
                if (data && data.picker && data.picker.length > 0) {
                    const firstItem = data.picker[0];
                    return res.json({
                        success: true,
                        video_url: firstItem.url,
                        thumbnail: firstItem.thumb || firstItem.url
                    });
                }
            }
        } catch (e) {
            console.error("Instagram Error:", e);
        }
    }
