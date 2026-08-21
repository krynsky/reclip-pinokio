module.exports = {
  run: [
    {
      method: "input",
      params: {
        title: "Set browser for YouTube cookies",
        description: "Currently set to: {{self.config.browser || '(none)'}}. yt-dlp will read cookies directly from this browser's cookie store on every download (see README: COOKIES_FROM_BROWSER). Leave the field blank to disable and fall back to an uploaded cookies.txt file instead. Examples: chrome, firefox, edge, brave, or chrome:Profile 2 for a specific profile.",
        form: [
          {
            key: "browser",
            title: "Browser",
            placeholder: "chrome"
          }
        ]
      }
    },
    {
      method: "self.set",
      params: {
        "config.json": {
          browser: "{{input.browser}}"
        }
      }
    },
    {
      method: "notify",
      params: {
        html: "{{input.browser ? 'Cookie browser set to \\'' + input.browser + '\\'. Restart the app for it to take effect.' : 'Cookie browser cleared. Restart the app — it will fall back to an uploaded cookies.txt file if present.'}}"
      }
    }
  ]
}
