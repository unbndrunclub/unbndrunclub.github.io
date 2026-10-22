// UNBND Run Club: shared on every public page.
// 1) Shows the announcement ribbon (from Supabase, or data/announcement.json if Supabase can't be reached)
// 2) Opens and closes the mobile menu in the page header
// 3) Makes the site installable as an app
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
  var cached = null, typing = false;
  try { cached = JSON.parse(localStorage.getItem("unbnd_annc") || "null"); } catch (e) {}
  // Once someone is filling in a form, a ribbon that changes doesn't push the page about (it shows on their next page)
  document.addEventListener("focusin", function (e) { if (e.target.matches && e.target.matches("input, textarea, select")) typing = true; });
  // The announcement is read from Supabase, so it shows as soon as it's published. The file on the website is the fallback.
  function fromSupabase() {
    var sb = window.UNBND_SUPABASE;
    if (!sb || !sb.url || !sb.key) return Promise.reject(new Error("no Supabase"));
    var ctrl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 5000);
    return fetch(sb.url + "/rest/v1/announcement?id=eq.1&select=text,link,updated", { headers: { apikey: sb.key }, cache: "no-store", signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error("Supabase " + r.status); return r.json(); })
      .then(function (rows) { if (!rows || !rows[0]) throw new Error("no announcement row"); return rows[0]; });
  }
  function fromFile() {
    return fetch("data/announcement.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; });
  }
  function start() {
    if (cached) show(cached);
    fromSupabase().catch(fromFile).then(function (a) {
      if (!a) return;
      a = { text: a.text || "", link: a.link || "", updated: a.updated || "" };
      try { localStorage.setItem("unbnd_annc", JSON.stringify(a)); } catch (e) {}
      if (JSON.stringify(a) !== JSON.stringify(cached) && !typing) show(a);
    }).catch(function () {});
  }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);

  // Mobile menu in the page header (the homepage wires up its own)
  function menu() {
    var burger = document.getElementById("burger"), sheet = document.getElementById("sheet");
    if (!burger || !sheet || window.UNBND_MENU) return;
    window.UNBND_MENU = true;
    function set(open) {
      sheet.hidden = !open; burger.setAttribute("aria-expanded", String(open)); burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.documentElement.classList.toggle("locked", open);
    }
    burger.addEventListener("click", function () { set(sheet.hidden); });
    sheet.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) { set(false); burger.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth >= 960 && !sheet.hidden) set(false); });
  }
  if (document.body) menu(); else document.addEventListener("DOMContentLoaded", menu);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
