module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        venv: "env",
        env: {
          HOST: "127.0.0.1",
          PORT: "{{port}}",
          COOKIES_FROM_BROWSER: "{{self.config.browser || ''}}"
        },
        path: "app",
        message: [
          "python ../server.py"
        ],
        on: [{
          event: "/(http:\\/\\/[0-9.:]+)/",
          done: true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[1]}}"
      }
    }
  ]
}
