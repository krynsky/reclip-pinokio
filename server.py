"""Launcher wrapper for ReClip.

Runs the untouched upstream app (app/app.py) with two launcher-side
features, so nothing in the app folder is modified and update.js
(git pull) keeps working:

1. YouTube cookies: injects cookies into every yt-dlp call, checked
   per call so changes take effect immediately without a restart.
   Three sources, in priority order:
     - COOKIES_FROM_BROWSER env var, if set.
     - Otherwise, the "browser" field in <launcher>/config.json, set
       via the "Set Cookie Browser" menu item (browser.js). Read
       directly from disk on every call rather than relying on
       Pinokio's script-level `self` template, which only exposes the
       currently-running script's own module and does not merge
       sibling JSON files despite what the Pinokio docs suggest.
     - Otherwise, if <launcher>/cookies.txt exists: `--cookies` with
       that file (populated via the "Add YouTube Cookies" menu item,
       from a manually exported Netscape-format cookies.txt).
   Either of the first two, when set, passes yt-dlp's own
   `--cookies-from-browser <value>` (e.g. "chrome", "firefox",
   "chrome:Profile 2"), reading the browser's cookie store directly;
   no file hits disk for that path.

2. Download progress: download commands run through Popen with
   `--newline`, their `[download] NN.N%` lines are parsed live into
   PROGRESS, the /api/status response is extended with a `progress`
   field, and a small script (progress.js) is injected into the web
   UI to render a per-card progress bar.
"""
import json
import os
import re
import sys
import threading
import subprocess
import importlib.util

ROOT = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(ROOT, "app")
COOKIES = os.path.join(ROOT, "cookies.txt")
CONFIG = os.path.join(ROOT, "config.json")


def _configured_browser():
    try:
        with open(CONFIG, encoding="utf-8") as f:
            return json.load(f).get("browser") or ""
    except (OSError, ValueError):
        return ""

# job_id -> {"percent": float, "phase": int}
PROGRESS = {}

_run = subprocess.run
_PCT = re.compile(r"\[download\]\s+(\d+(?:\.\d+)?)%")


def _job_id_from_cmd(cmd):
    """Extract the job id from the -o '<dir>/<job_id>.%(ext)s' template."""
    try:
        out = cmd[cmd.index("-o") + 1]
    except (ValueError, IndexError):
        return None
    base = os.path.basename(out)
    if base.endswith(".%(ext)s"):
        return base[: -len(".%(ext)s")]
    return None


def _run_download_with_progress(cmd, job_id, timeout=None):
    """Run a yt-dlp download, streaming stdout to track progress.

    Mimics subprocess.run(capture_output=True, text=True, timeout=...):
    returns CompletedProcess and raises TimeoutExpired on timeout.
    """
    cmd = cmd[:1] + ["--newline"] + cmd[1:]
    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )

    timed_out = threading.Event()
    timer = None
    if timeout:
        def _kill():
            timed_out.set()
            proc.kill()
        timer = threading.Timer(timeout, _kill)
        timer.start()

    stderr_buf = []
    reader = threading.Thread(
        target=lambda: stderr_buf.append(proc.stderr.read()), daemon=True
    )
    reader.start()

    stdout_lines = []
    phase = 0
    try:
        for line in proc.stdout:
            stdout_lines.append(line)
            if "[download] Destination:" in line:
                phase += 1
                PROGRESS[job_id] = {"percent": 0.0, "phase": phase}
            m = _PCT.search(line)
            if m:
                PROGRESS[job_id] = {
                    "percent": float(m.group(1)),
                    "phase": max(phase, 1),
                }
    finally:
        rc = proc.wait()
        reader.join(timeout=5)
        if timer:
            timer.cancel()

    if timed_out.is_set():
        raise subprocess.TimeoutExpired(cmd, timeout)
    return subprocess.CompletedProcess(
        cmd, rc, "".join(stdout_lines), stderr_buf[0] if stderr_buf else ""
    )


def _patched_run(cmd, *args, **kwargs):
    if isinstance(cmd, list) and cmd and cmd[0] == "yt-dlp":
        browser = os.environ.get("COOKIES_FROM_BROWSER") or _configured_browser()
        if browser:
            cmd = [cmd[0], "--cookies-from-browser", browser] + cmd[1:]
        elif os.path.isfile(COOKIES):
            cmd = [cmd[0], "--cookies", COOKIES] + cmd[1:]
        job_id = _job_id_from_cmd(cmd)
        if job_id and kwargs.get("capture_output"):
            return _run_download_with_progress(
                cmd, job_id, timeout=kwargs.get("timeout")
            )
    return _run(cmd, *args, **kwargs)


subprocess.run = _patched_run

# Load the untouched upstream app as a module (its __main__ guard keeps
# it from starting the server; we start it ourselves below).
os.chdir(APP)
sys.path.insert(0, APP)
spec = importlib.util.spec_from_file_location(
    "reclip_app", os.path.join(APP, "app.py")
)
mod = importlib.util.module_from_spec(spec)
sys.modules["reclip_app"] = mod
spec.loader.exec_module(mod)
flask_app = mod.app

from flask import jsonify  # noqa: E402  (import after venv app load)


def _check_status(job_id):
    job = mod.jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify({
        "status": job["status"],
        "error": job.get("error"),
        "filename": job.get("filename"),
        "progress": PROGRESS.get(job_id),
    })


flask_app.view_functions["check_status"] = _check_status

with open(os.path.join(ROOT, "progress.js"), encoding="utf-8") as f:
    _PROGRESS_JS = f.read()


@flask_app.after_request
def _inject_progress_ui(resp):
    if resp.content_type and resp.content_type.startswith("text/html"):
        html = resp.get_data(as_text=True)
        if "</body>" in html:
            resp.set_data(html.replace(
                "</body>", "<script>" + _PROGRESS_JS + "</script></body>"
            ))
    return resp


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8899))
    host = os.environ.get("HOST", "127.0.0.1")
    flask_app.run(host=host, port=port)
