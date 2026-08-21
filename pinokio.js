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

module.exports = {
  version: "5.0",
  title: "ReClip",
  description: "Self-hosted video/audio downloader powered by yt-dlp with a clean web UI.",
  icon: "icon.svg",
  menu: async (kernel, info) => {
    let installed = info.exists("app/env")
    let browser = currentBrowser()
    let cookies = {
      icon: "fa-solid fa-cookie-bite",
      text: info.exists("cookies.txt") ? "Update YouTube Cookies" : "Add YouTube Cookies",
      href: "cookies.js",
    }
    let cookieBrowser = {
      icon: "fa-solid fa-globe",
      text: browser ? `Cookie Browser: ${browser}` : "Set Cookie Browser",
      href: "browser.js",
    }
    let running = {
      install: info.running("install.js"),
      start: info.running("start.js"),
      update: info.running("update.js"),
      reset: info.running("reset.js")
    }
    if (running.install) {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Installing",
        href: "install.js",
      }]
    } else if (installed) {
      if (running.start) {
        let local = info.local("start.js")
        if (local && local.url) {
          return [{
            default: true,
            icon: "fa-solid fa-rocket",
            text: "Open Web UI",
            href: local.url,
          }, {
            icon: 'fa-solid fa-terminal',
            text: "Terminal",
            href: "start.js",
          }, cookies, cookieBrowser]
        } else {
          return [{
            default: true,
            icon: 'fa-solid fa-terminal',
            text: "Terminal",
            href: "start.js",
          }, cookies, cookieBrowser]
        }
      } else if (running.update) {
        return [{
          default: true,
          icon: 'fa-solid fa-terminal',
          text: "Updating",
          href: "update.js",
        }]
      } else if (running.reset) {
        return [{
          default: true,
          icon: 'fa-solid fa-terminal',
          text: "Resetting",
          href: "reset.js",
        }]
      } else {
        return [{
          default: true,
          icon: "fa-solid fa-power-off",
          text: "Start",
          href: "start.js",
        }, cookies, cookieBrowser, {
          icon: "fa-solid fa-plug",
          text: "Update",
          href: "update.js",
        }, {
          icon: "fa-solid fa-plug",
          text: "Install",
          href: "install.js",
        }, {
          icon: "fa-regular fa-circle-xmark",
          text: "Reset",
          href: "reset.js",
        }]
      }
    } else {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Install",
        href: "install.js",
      }]
    }
  }
}
