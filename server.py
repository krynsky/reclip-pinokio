"""Launcher wrapper for ReClip.

Runs the untouched upstream app (app/app.py) but injects
`--cookies <launcher>/cookies.txt` into every yt-dlp subprocess call
when that file exists, so YouTube "Sign in to confirm you're not a
bot" / cookie errors can be fixed without modifying the app folder.
The file check happens on every call, so cookies added or replaced
while the server is running take effect immediately.
"""
import os
import sys
import runpy
import subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(ROOT, "app")
COOKIES = os.path.join(ROOT, "cookies.txt")

_run = subprocess.run


def _run_with_cookies(cmd, *args, **kwargs):
    if isinstance(cmd, list) and cmd and cmd[0] == "yt-dlp" and os.path.isfile(COOKIES):
        cmd = [cmd[0], "--cookies", COOKIES] + cmd[1:]
    return _run(cmd, *args, **kwargs)


subprocess.run = _run_with_cookies

os.chdir(APP)
sys.path.insert(0, APP)
runpy.run_path(os.path.join(APP, "app.py"), run_name="__main__")
