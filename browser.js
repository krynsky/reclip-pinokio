const fs = require("fs")
const path = require("path")

function currentBrowser() {
  try {
    let config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"))
    return config.browser || ""
  } catch (e) {
    return ""
  }
}

// Exported as a function (not a plain object) so the "default" field below
// can be filled in with a real value read straight off disk, rather than a
// Pinokio {{template}} expression -- `self` here would only be this
// script's own module, not config.json's contents, so a template can't
// reach it.
module.exports = async (kernel) => {
  return {
    run: [
      {
        method: "input",
        params: {
          title: "Set browser for YouTube cookies",
          description: "yt-dlp will read cookies directly from this browser's cookie store on every download (see README: COOKIES_FROM_BROWSER). Leave the field blank to disable and fall back to an uploaded cookies.txt file instead. Examples: chrome, firefox, edge, brave, or chrome:Profile 2 for a specific profile.",
          form: [
            {
              key: "browser",
              title: "Browser",
              placeholder: "chrome",
              default: currentBrowser()
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
          html: "{{input.browser ? 'Cookie browser set to \\'' + input.browser + '\\'.' : 'Cookie browser cleared. Falls back to an uploaded cookies.txt file if present.'}}"
        }
      }
    ]
  }
}
