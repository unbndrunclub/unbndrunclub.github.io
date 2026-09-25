// UNBND Run Club: shared on every public page.
// 1) Shows the announcement ribbon (from data/announcement.json)
// 2) Makes the site installable as an app
(function () {
  var style = document.createElement("style");
  style.textContent =
    ".unbnd-annc{background:#fe90ae;color:#000;padding:calc(env(safe-area-inset-top,0px) + 10px) 16px 10px;font:600 15px/1.4 Barlow,system-ui,sans-serif;position:relative;z-index:10}" +
    ".unbnd-annc .in{max-width:1080px;margin:0 auto;display:flex;gap:10px 14px;align-items:center;flex-wrap:wrap}" +
    ".unbnd-annc b{font:italic 800 16px/1 'Barlow Condensed',sans-serif;text-transform:uppercase;background:#000;color:#fe90ae;padding:5px 8px;border-radius:6px}" +
    ".unbnd-annc span{flex:1;min-width:200px}" +
    ".unbnd-annc a{color:#000;font-weight:700;white-space:nowrap}" +
    "html.has-ribbon .hero,html.has-ribbon .home-hero{padding-top:18px!important}";
  document.head.appendChild(style);

  function show(a) {
    var old = document.getElementById("unbndAnnc");
    if (old) old.remove();
    if (!a || !a.text) { if (!document.getElementById("nextRibbon")) document.documentElement.classList.remove("has-ribbon"); return; }
    var el = document.createElement("div");
    el.className = "unbnd-annc"; el.id = "unbndAnnc"; el.setAttribute("role", "status");
    var inner = document.createElement("div"); inner.className = "in";
    var tag = document.createElement("b"); tag.textContent = "Announcement";
    var txt = document.createElement("span"); txt.textContent = a.text;
    inner.appendChild(tag); inner.appendChild(txt);
    if (a.link) { var l = document.createElement("a"); l.href = a.link; l.textContent = "Details"; l.rel = "noopener"; inner.appendChild(l); }
    el.appendChild(inner);
    document.body.insertBefore(el, document.body.firstChild);
    document.documentElement.classList.add("has-ribbon");
  }
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem("unbnd_annc") || "null"); } catch (e) {}
  function start() {
    if (cached) show(cached);
    fetch("data/announcement.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (a) {
        if (!a) return;
        try { localStorage.setItem("unbnd_annc", JSON.stringify(a)); } catch (e) {}
        if (JSON.stringify(a) !== JSON.stringify(cached)) show(a);
      }).catch(function () {});
  }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
