module.exports = {
  run: [
    {
      method: "filepicker.open",
      params: {
        title: "Select your exported YouTube cookies.txt (Netscape format)",
        type: "file",
        filetypes: [["Cookies file", "*.txt"]]
      }
    },
    {
      method: "fs.copy",
      params: {
        src: "{{input.paths[0]}}",
        dest: "cookies.txt"
      }
    },
    {
      method: "notify",
      params: {
        html: "YouTube cookies saved. They apply immediately, even while the app is running."
      }
    }
  ]
}
