# ReClip (Pinokio Launcher)

1-click launcher for [ReClip](https://github.com/averygan/reclip) — a self-hosted, open-source video and audio downloader with a clean web UI, powered by `yt-dlp` and `ffmpeg`.

## What it does

- Downloads videos and audio from 1000+ sites (YouTube, TikTok, Instagram, X, etc.)
- Choose MP4 video or MP3 audio, pick quality/resolution
- Batch download multiple URLs at once
- Live per-video progress bar while downloading (added by this launcher)
- Lightweight Flask backend + vanilla JS frontend

## How to use

1. Click **Install** — clones the repo, installs `ffmpeg` via conda, and installs `flask` + `yt-dlp` into a venv.
2. Click **Start** — launches the Flask server on an automatically assigned free port, bound to `127.0.0.1`.
3. Click **Open Web UI** — opens the app in your browser.
4. Paste one or more URLs, pick MP4/MP3 and quality, then Fetch and Download.

Use **Update** to pull the latest ReClip sources and **Reset** to wipe the install.

## Fixing YouTube cookie errors ("Sign in to confirm you're not a bot")

YouTube sometimes blocks anonymous downloads and yt-dlp fails with an error like
`Sign in to confirm you're not a bot` or asks for cookies. This launcher can pass
YouTube cookies to yt-dlp two ways:

### Option A: read cookies straight from your browser (recommended)

In the launcher sidebar, click **Set Cookie Browser** and enter a value yt-dlp's
`--cookies-from-browser` accepts — e.g. `chrome`, `edge`, `firefox`, `brave`, or
`chrome:Profile 2` to pick a specific profile. Then **Start** (or restart) the
app. yt-dlp reads the cookie store directly on each call; no `cookies.txt` file
is ever written to disk, and no browser extension is needed.

The button label shows the currently configured browser (or "Set Cookie Browser"
if none is set). Click it again any time to change it, or clear the field and
save to disable — a restart is needed either way for the change to take effect.

> **Known issue on Windows with Chrome:** recent Chrome versions (127+) use
> "App-Bound Encryption" for cookie storage, and yt-dlp can fail to decrypt
> them with `Failed to decrypt with DPAPI` even with the browser fully closed
> and yt-dlp up to date — see [yt-dlp#10927](https://github.com/yt-dlp/yt-dlp/issues/10927).
> This is an unresolved upstream yt-dlp/Chrome compatibility issue, not
> something this launcher can work around. If you hit it, use Option B below,
> or try `firefox` or `edge` for `COOKIES_FROM_BROWSER` if you have one of
> those installed instead.

### Option B: export a cookies.txt file

1. In your browser (logged in to YouTube), export cookies with an extension such as
   **Get cookies.txt LOCALLY** (Chrome/Edge) or **cookies.txt** (Firefox). Export in
   **Netscape format** for `youtube.com`.
2. In the launcher sidebar, click **Add YouTube Cookies** and select the exported file.
3. Retry the download — cookies apply immediately, even while the app is running.
   No restart needed.

To refresh expired cookies, just click **Update YouTube Cookies** and pick a newer
export. The file is stored as `cookies.txt` in the launcher folder (git-ignored, never
committed) and is only ever passed to your local yt-dlp process.

If `COOKIES_FROM_BROWSER` is set, it takes priority over `cookies.txt` on every
yt-dlp call.

## API

ReClip exposes a small Flask API. The base URL is whatever **Open Web UI** shows (e.g. `http://127.0.0.1:PORT`). Replace `BASE` below with that URL.

### Fetch video metadata — `POST /api/info`

Body: `{"url": "..."}`. Returns `title`, `thumbnail`, `duration`, `uploader`, and `formats` (one best format per resolution, each with `id`, `label`, `height`).

**curl**

```bash
curl -X POST "$BASE/api/info" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

**JavaScript**

```js
const res = await fetch(`${BASE}/api/info`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
});
const info = await res.json();
```

**Python**

```python
import requests
info = requests.post(f"{BASE}/api/info", json={
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}).json()
```

### Expand a playlist — `POST /api/playlist`

Body: `{"url": "..."}`. Returns `{"urls": [...]}` with the individual video URLs.

### Download — `POST /api/download`, then poll

Downloads are asynchronous: start a job, poll its status, then fetch the file.

Body: `{"url": "...", "format": "video" | "audio", "format_id": "<optional id from /api/info>", "title": "<optional, used for the filename>"}`. Returns `{"job_id": "..."}`.

- `GET /api/status/<job_id>` → `{"status": "downloading" | "done" | "error", "error": ..., "filename": ...}`
- `GET /api/file/<job_id>` → the finished MP4/MP3 file (once status is `done`)

**curl**

```bash
JOB=$(curl -s -X POST "$BASE/api/download" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "format": "video"}' | jq -r .job_id)
curl "$BASE/api/status/$JOB"          # repeat until status is "done"
curl -OJ "$BASE/api/file/$JOB"
```

**JavaScript**

```js
const { job_id } = await (await fetch(`${BASE}/api/download`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", format: "video" })
})).json();

let status;
do {
  await new Promise(r => setTimeout(r, 2000));
  status = await (await fetch(`${BASE}/api/status/${job_id}`)).json();
} while (status.status === "downloading");

if (status.status === "done") {
  const blob = await (await fetch(`${BASE}/api/file/${job_id}`)).blob();
}
```

**Python**

```python
import time, requests

job = requests.post(f"{BASE}/api/download", json={
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "format": "video"
}).json()["job_id"]

while True:
    status = requests.get(f"{BASE}/api/status/{job}").json()
    if status["status"] != "downloading":
        break
    time.sleep(2)

if status["status"] == "done":
    r = requests.get(f"{BASE}/api/file/{job}", stream=True)
    with open(status["filename"], "wb") as f:
        for chunk in r.iter_content(1 << 14):
            f.write(chunk)
```
