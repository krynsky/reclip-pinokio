# ReClip (Pinokio Launcher)

1-click launcher for [ReClip](https://github.com/averygan/reclip) — a self-hosted, open-source video and audio downloader with a clean web UI, powered by `yt-dlp` and `ffmpeg`.

## What it does

- Downloads videos and audio from 1000+ sites (YouTube, TikTok, Instagram, X, etc.)
- Choose MP4 video or MP3 audio, pick quality/resolution
- Batch download multiple URLs at once
- Lightweight Flask backend + vanilla JS frontend

## How to use

1. Click **Install** — clones the repo, installs `ffmpeg` via conda, and installs `flask` + `yt-dlp` into a venv.
2. Click **Start** — launches the Flask server on an automatically assigned free port, bound to `127.0.0.1`.
3. Click **Open Web UI** — opens the app in your browser.
4. Paste one or more URLs, pick MP4/MP3 and quality, then Fetch and Download.

Use **Update** to pull the latest ReClip sources and **Reset** to wipe the install.

## API

ReClip exposes a small Flask API. The base URL is whatever **Open Web UI** shows (e.g. `http://127.0.0.1:PORT`). Replace `BASE` below with that URL.

### Fetch metadata for URLs

**curl**

```bash
curl -X POST "$BASE/fetch" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"], "mode": "mp4"}'
```

**JavaScript**

```js
const res = await fetch(`${BASE}/fetch`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    urls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    mode: "mp4"
  })
});
const data = await res.json();
```

**Python**

```python
import requests
r = requests.post(f"{BASE}/fetch", json={
    "urls": ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    "mode": "mp4"
})
print(r.json())
```

### Download a video/audio

**curl**

```bash
curl -X POST "$BASE/download" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "mode": "mp4", "quality": "720"}' \
  -OJ
```

**JavaScript**

```js
const res = await fetch(`${BASE}/download`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    mode: "mp4",
    quality: "720"
  })
});
const blob = await res.blob();
```

**Python**

```python
import requests
r = requests.post(f"{BASE}/download", json={
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "mode": "mp4",
    "quality": "720"
}, stream=True)
with open("out.mp4", "wb") as f:
    for chunk in r.iter_content(1 << 14):
        f.write(chunk)
```

> Exact endpoint names/params may evolve upstream — check `app/app.py` in the installed app folder for the canonical route definitions.
