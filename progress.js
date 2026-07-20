// Injected by the ReClip Pinokio launcher (server.py) — renders a live
// progress bar inside each card while its download is running. Reads the
// `progress` field the launcher adds to /api/status responses.
(function () {
  var style = document.createElement("style");
  style.textContent =
    ".reclip-bar{width:120px;height:6px;border-radius:3px;background:var(--card-border,#e2ded6);overflow:hidden;display:inline-block;vertical-align:middle;margin-right:8px}" +
    ".reclip-bar i{display:block;height:100%;width:0;background:var(--accent,#e85d2a);transition:width .4s ease}" +
    ".reclip-pct{font-size:0.68rem;color:var(--accent,#e85d2a)}";
  document.head.appendChild(style);

  setInterval(function () {
    if (typeof cardData === "undefined") return;
    cardData.forEach(function (c, i) {
      if (c.status !== "downloading" || !c.jobId) return;
      fetch("/api/status/" + c.jobId)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.progress || c.status !== "downloading") return;
          var slot = document.querySelector("#card-" + i + " .card-status.downloading");
          if (!slot) return;
          var pct = Math.max(0, Math.min(100, d.progress.percent || 0));
          var bar = slot.querySelector(".reclip-bar i");
          if (!bar) {
            slot.innerHTML =
              '<span class="reclip-bar"><i></i></span><span class="reclip-pct"></span>';
            bar = slot.querySelector(".reclip-bar i");
          }
          bar.style.width = pct + "%";
          slot.querySelector(".reclip-pct").textContent =
            pct >= 100 ? "Processing..." : pct.toFixed(0) + "%" +
              (d.progress.phase > 1 ? " (audio)" : "");
        })
        .catch(function () {});
    });
  }, 500);
})();
