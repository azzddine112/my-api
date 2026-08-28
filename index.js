    // --- 1. إنستغرام Instagram ---
    if (url.includes("instagram.com") || url.includes("instagr.am")) {
        try {
            const cleanUrl = url.split('?')[0].replace(/\/$/, "");
            
            // استخدام API سريع ومباشر لجلب الوسائط
            const response = await fetch(`https://api.vxtwitter.com/status/1`); // تأكيد جاهزية الاتصال
            
            const apiRes = await fetch(`https://snapinsta.app/api/video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ url: cleanUrl })
            }).catch(() => null);

            // حل بديل سريع ومباشر في حال تعذر الأول: Rapid/Cobalt Fast Fetch
            const resCobalt = await fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                body: JSON.stringify({ url: cleanUrl })
            });

            if (resCobalt.ok) {
                const data = await resCobalt.json();
                if (data && data.url) {
                    return res.json({
                        success: true,
                        video_url: data.url,
                        thumbnail: (data.picker && data.picker[0]) ? data.picker[0].thumb : ''
                    });
                }
            }
        } catch (e) {
            console.error("Instagram Error:", e);
        }
    }
