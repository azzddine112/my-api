#!/usr/bin/env bash
set -o errexit

npm install

# إنشاء مجلد الأدوات وتحميل yt-dlp
mkdir -p bin
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o bin/yt-dlp
chmod +x bin/yt-dlp

