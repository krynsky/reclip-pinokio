module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/averygan/reclip app"
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        message: [
          "conda install -y -c conda-forge \"ffmpeg=*=*gpl*\" --no-deps"
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        message: [
          "uv pip install flask yt-dlp"
        ]
      }
    },
    {
      method: "self.set",
      params: {
        "config.json": {
          browser: ""
        }
      }
    }
  ]
}
