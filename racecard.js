// UNBND race card images, drawn on the phone (1080 x 1920).
// story(): "I'm running" image for Instagram stories. It never has the QR code.
// ticket(): the race card itself, with the QR code and the terms. This is the one people save.
// Every picture is drawn with canvas paths, so the image stays saveable in every browser.
(function () {
  const W = 1080, H = 1920, PINK = "#fe90ae", INK = "#0b0b0d";
  const C = '"Barlow Condensed", "Arial Narrow", sans-serif', B = 'Barlow, Arial, sans-serif';
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); return this;
    };
  }
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);   // same picture every time
  function wrap(x, text, maxW) {
    const words = String(text).split(/\s+/).filter(Boolean), lines = []; let line = "";
    words.forEach((w) => { const t = line ? line + " " + w : w; if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line); return lines;
  }
  function fit(x, text, font, size, maxW, min) {   // biggest size (down to min) that fits on one line
    for (; size > min; size -= 2) { x.font = font.replace("#", size); if (x.measureText(text).width <= maxW) return size; }
    x.font = font.replace("#", min); return min;
  }
  const spaced = (s) => s.split("").join(String.fromCharCode(8202));
  function loadImg(src) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
  async function fonts() {
    try { await Promise.all([document.fonts.load('italic 800 100px "Barlow Condensed"'), document.fonts.load('700 40px "Barlow Condensed"'),
      document.fonts.load('600 40px "Barlow"'), document.fonts.load('700 40px "Barlow"'), document.fonts.load('500 40px "Barlow"')]); } catch (e) {}
  }

  // ---- Where and when: picks the scenery and the sky ----
  function themeOf(place) {
    const p = String(place || "").toLowerCase();
    if (/worli|sea ?link/.test(p)) return "worli";
    if (/marine|nariman|trident|chowpatty|queen'?s necklace|netaji subhash/.test(p)) return "marine";
    if (/kharg|hill|trail|pandav|forest|aarey|sanjay gandhi|yeoor/.test(p)) return "hills";
    return "city";
  }
  function skyOf(time) {
    const h = Number(String(time || "21:00").split(":")[0]);
    return h >= 4 && h < 7 ? "dawn" : h >= 7 && h < 17 ? "day" : "night";
  }
  const SKY = {   // top, middle, horizon
    night: ["#050507", "#140a10", "#3a1a27"],
    dawn: ["#0d0a14", "#5a2d45", "#fe90ae"],
    day: ["#ffd9e3", "#ffeef3", "#ffffff"]
  };

  // ---- Sky, stars, moon or sun ----
  function sky(x, top, bottom, kind) {
    const g = x.createLinearGradient(0, top, 0, bottom), s = SKY[kind];
    g.addColorStop(0, s[0]); g.addColorStop(.6, s[1]); g.addColorStop(1, s[2]);
    x.fillStyle = g; x.fillRect(0, top, W, bottom - top);
    if (kind !== "day") {
      const r = rng(5); x.fillStyle = "#fff";
      for (let i = 0; i < 90; i++) { const yy = top + r() * (bottom - top) * .7; x.globalAlpha = (.25 + r() * .6) * (kind === "dawn" ? .6 : 1); x.beginPath(); x.arc(r() * W, yy, r() * 2.2 + .6, 0, Math.PI * 2); x.fill(); }
      x.globalAlpha = 1;
    }
  }
  function orb(x, cx, cy, rad, kind) {
    const glow = x.createRadialGradient(cx, cy, rad * .5, cx, cy, rad * 4);
    glow.addColorStop(0, kind === "night" ? "rgba(254,144,174,.35)" : "rgba(255,255,255,.7)"); glow.addColorStop(1, "rgba(254,144,174,0)");
    x.fillStyle = glow; x.beginPath(); x.arc(cx, cy, rad * 4, 0, Math.PI * 2); x.fill();
    x.fillStyle = kind === "night" ? "#ffe9ef" : "#fff"; x.beginPath(); x.arc(cx, cy, rad, 0, Math.PI * 2); x.fill();
    if (kind === "night") { x.fillStyle = "rgba(254,144,174,.25)"; [[-.3, -.2, .22], [.25, .15, .16], [-.05, .4, .12]].forEach(([a, b, c]) => { x.beginPath(); x.arc(cx + a * rad, cy + b * rad, c * rad, 0, Math.PI * 2); x.fill(); }); }
  }
  function water(x, top, bottom, kind) {
    const g = x.createLinearGradient(0, top, 0, bottom);
    if (kind === "day") { g.addColorStop(0, "#f7c3d1"); g.addColorStop(1, "#e7a2b6"); } else { g.addColorStop(0, "#2a1420"); g.addColorStop(1, "#070507"); }
    x.fillStyle = g; x.fillRect(0, top, W, bottom - top);
    const r = rng(3); x.strokeStyle = kind === "day" ? "rgba(255,255,255,.55)" : "rgba(254,144,174,.28)"; x.lineCap = "round";
    for (let i = 0; i < 40; i++) { const yy = top + 10 + r() * (bottom - top - 20), xx = r() * W, l = 20 + r() * 70 * ((yy - top) / (bottom - top) + .4); x.lineWidth = 2 + ((yy - top) / (bottom - top)) * 3; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + l, yy); x.stroke(); }
  }
  // Buildings with lit windows; deco gives Art Deco stepped tops
  function building(x, bx, base, bw, bh, col, lit, r, deco) {
    x.fillStyle = col;
    x.beginPath(); x.rect(bx, base - bh, bw, bh); x.fill();
    if (deco) {
      const s1 = bw * .7, s2 = bw * .4;
      x.fillRect(bx + (bw - s1) / 2, base - bh - bh * .08, s1, bh * .08);
      x.fillRect(bx + (bw - s2) / 2, base - bh - bh * .14, s2, bh * .06);
      x.fillRect(bx + bw / 2 - 2, base - bh - bh * .24, 4, bh * .1);
    }
    if (!lit) return;
    const cw = Math.max(5, bw / 7), ch = cw * 1.2;
    for (let yy = base - bh + ch; yy < base - ch; yy += ch * 2) for (let xx = bx + cw; xx < bx + bw - cw; xx += cw * 2) {
      if (r() < .5) { x.fillStyle = r() < .3 ? PINK : lit; x.fillRect(xx, yy, cw, ch); }
    }
  }

  // ---- The places ----
  function sceneMarine(x, top, bottom, kind) {
    const hz = top + (bottom - top) * .42, night = kind !== "day", r = rng(21);
    sky(x, top, hz + 40, kind);
    orb(x, W * .82, top + (hz - top) * .35, 46, kind);
    // Far skyline of Nariman Point across the bay
    const far = night ? "#1f1218" : "#e9b9c7";
    for (let bx = W * .5; bx < W; ) { const bw = 26 + r() * 40, bh = (bx - W * .45) * .45 + r() * 60; building(x, bx, hz + 60, bw, bh, far, night ? "rgba(255,230,200,.5)" : null, r, false); bx += bw + 3; }   // Nariman Point
    water(x, hz, bottom, kind);
    // The curve of Marine Drive: Art Deco fronts, then the Queen's Necklace of street lights
    const curve = (t) => [W * (-.05 + 1.1 * t), hz + 200 - Math.sin(t * Math.PI * .9) * 80 - t * 110];
    const deco = night ? "#3a2230" : "#c98aa0";
    for (let t = 0; t < 1; t += .055) {
      const [px, py] = curve(t), s = 1.25 - t * .7, bw = 62 * s, bh = (90 + r() * 70) * s;
      building(x, px, py - 6, bw, bh, deco, night ? "rgba(255,236,214,.8)" : null, r, true);
    }
    x.strokeStyle = night ? "#120a0f" : "#a96f84"; x.lineWidth = 14; x.beginPath();
    for (let t = 0; t <= 1.001; t += .02) { const [px, py] = curve(t); t ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
    for (let t = 0; t <= 1; t += .025) {   // the necklace
      const [px, py] = curve(t), s = 1.2 - t * .6;
      const gl = x.createRadialGradient(px, py - 14, 0, px, py - 14, 22 * s); gl.addColorStop(0, night ? "rgba(255,214,150,.95)" : "rgba(255,255,255,.9)"); gl.addColorStop(1, "rgba(255,214,150,0)");
      x.fillStyle = gl; x.beginPath(); x.arc(px, py - 14, 22 * s, 0, Math.PI * 2); x.fill();
      x.fillStyle = night ? "#fff3dd" : "#fff"; x.beginPath(); x.arc(px, py - 14, 4.5 * s, 0, Math.PI * 2); x.fill();
      if (night) { const rf = x.createLinearGradient(0, py + 4, 0, py + 60 * s); rf.addColorStop(0, "rgba(255,214,150,.35)"); rf.addColorStop(1, "rgba(255,214,150,0)"); x.fillStyle = rf; x.fillRect(px - 2.5 * s, py + 4, 5 * s, 60 * s); }   // reflection
    }
    // Promenade, sea wall and tetrapods in front
    const pr = bottom - (bottom - top) * .1;
    x.fillStyle = night ? "#1a1016" : "#d99aae"; x.beginPath(); x.moveTo(0, pr - 30);
    for (let i = 0; i <= 18; i++) { const tx = i * 64; x.lineTo(tx + 10, pr - 30 - (i % 2 ? 26 : 14)); x.lineTo(tx + 40, pr - 30 - (i % 2 ? 10 : 28)); }
    x.lineTo(W, pr); x.lineTo(0, pr); x.fill();
    x.fillStyle = night ? "#0d080b" : "#b97489"; x.fillRect(0, pr - 12, W, 22);
    x.fillStyle = night ? "#000" : "#2a1a20"; x.fillRect(0, pr + 10, W, bottom - pr - 10);
    stripe(x, pr + 10, bottom, night);
  }
  function sceneWorli(x, top, bottom, kind) {
    const hz = top + (bottom - top) * .5, night = kind !== "day", r = rng(33);
    sky(x, top, hz + 40, kind);
    orb(x, W * .14, top + (hz - top) * .3, 40, kind);
    const far = night ? "#1d1117" : "#efc4d1";   // Bandra in the distance
    for (let bx = W * .6; bx < W; ) { const bw = 26 + r() * 40, bh = 30 + r() * 70; building(x, bx, hz, bw, bh, far, night ? "rgba(255,230,200,.45)" : null, r, false); bx += bw + 3; }
    water(x, hz, bottom, kind);
    // The Sea Link: a gently rising deck with two cable-stayed towers
    const deckY = (px) => hz + 36 - Math.sin((px / W) * Math.PI) * 26;
    const towers = [W * .4, W * .7], tH = [(bottom - top) * .5, (bottom - top) * .42];
    const steel = night ? "#efe4e8" : "#3a2830", cable = night ? "rgba(255,240,245,.75)" : "rgba(58,40,48,.75)";
    towers.forEach((tx, i) => {
      const d = deckY(tx), topY = d - tH[i], fork = d - tH[i] * .42, spread = 28 + i * -4;
      x.strokeStyle = cable; x.lineWidth = 2.2;
      for (let k = 1; k <= 9; k++) {   // fan of cables on both sides
        const ay = topY + tH[i] * (.06 + k * .035), span = 26 + k * 30;
        [-1, 1].forEach((s) => { x.beginPath(); x.moveTo(tx, ay); x.lineTo(tx + s * span * (1.2 - i * .2), deckY(tx + s * span) - 4); x.stroke(); });
      }
      x.fillStyle = steel;   // the inverted Y
      x.beginPath(); x.moveTo(tx - 7, topY); x.lineTo(tx + 7, topY); x.lineTo(tx + 9, fork);
      x.lineTo(tx + spread, d + 44); x.lineTo(tx + spread - 14, d + 44); x.lineTo(tx, fork + 30); x.lineTo(tx - spread + 14, d + 44);
      x.lineTo(tx - spread, d + 44); x.lineTo(tx - 9, fork); x.closePath(); x.fill();
      if (night) { x.fillStyle = "rgba(254,144,174,.9)"; x.beginPath(); x.arc(tx, topY - 6, 5, 0, Math.PI * 2); x.fill(); }
    });
    x.strokeStyle = steel; x.lineWidth = 9; x.beginPath();
    for (let px = -10; px <= W + 10; px += 10) px === -10 ? x.moveTo(px, deckY(px)) : x.lineTo(px, deckY(px)); x.stroke();
    x.fillStyle = steel; for (let px = 30; px < W; px += 90) x.fillRect(px - 3, deckY(px), 6, 44);   // piers
    if (night) for (let px = 10; px < W; px += 36) {   // lights on the deck
      x.fillStyle = "rgba(255,214,150,.95)"; x.beginPath(); x.arc(px, deckY(px) - 8, 3, 0, Math.PI * 2); x.fill();
    }
    // Worli Sea Face: parapet, lamp posts and the promenade
    const pr = bottom - (bottom - top) * .1;
    x.fillStyle = night ? "#1c1218" : "#d99aae"; x.fillRect(0, pr - 34, W, 34);
    x.fillStyle = night ? "#2a1a22" : "#e8b3c2"; x.fillRect(0, pr - 40, W, 10);
    for (let lx = 70; lx < W; lx += 240) {
      x.fillStyle = night ? "#2a1a22" : "#7a4a5c"; x.fillRect(lx - 4, pr - 210, 8, 176);
      x.fillRect(lx - 4, pr - 210, 40, 7);
      const gl = x.createRadialGradient(lx + 36, pr - 196, 0, lx + 36, pr - 196, 70); gl.addColorStop(0, night ? "rgba(255,214,150,.75)" : "rgba(255,255,255,.6)"); gl.addColorStop(1, "rgba(255,214,150,0)");
      x.fillStyle = gl; x.beginPath(); x.arc(lx + 36, pr - 196, 70, 0, Math.PI * 2); x.fill();
      x.fillStyle = night ? "#fff3dd" : "#fff"; x.beginPath(); x.arc(lx + 36, pr - 198, 9, 0, Math.PI * 2); x.fill();
    }
    x.fillStyle = night ? "#000" : "#2a1a20"; x.fillRect(0, pr, W, bottom - pr);
    stripe(x, pr, bottom, night);
  }
  function sceneHills(x, top, bottom, kind) {
    const hz = top + (bottom - top) * .55, night = kind === "night";
    sky(x, top, bottom, kind);
    orb(x, W * .66, hz - (bottom - top) * .1, kind === "night" ? 44 : 64, kind);
    const layers = night ? ["#2a1620", "#1d1017", "#120a0f", "#070506"] : kind === "dawn" ? ["#b45f7e", "#7d3a57", "#4a2033", "#1a0c13"] : ["#f3bccb", "#dc8fa8", "#b86784", "#5a2d3e"];
    layers.forEach((col, i) => {   // ridges, near ones darker and taller
      const base = hz + i * (bottom - hz) * .17, amp = 70 + i * 45, r = rng(40 + i);
      x.fillStyle = col; x.beginPath(); x.moveTo(0, bottom);
      const n = 5 + i, pts = [[-20, base - amp * .3]];
      for (let k = 0; k < n; k++) {   // each hill: a slope up, a short flat top, a slope down
        const cx = (k + .3 + r() * .4) * W / (n - .6), top2 = base - amp * (.6 + r() * .4), half = W / n * (.18 + r() * .12);
        pts.push([cx - half * 2.2, base - amp * (.2 + r() * .2)], [cx - half * .5, top2], [cx + half * .5, top2 + r() * 8]);
      }
      pts.push([W + 20, base - amp * .3]);
      x.lineTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) { const [ax, ay] = pts[k - 1], [bx, by] = pts[k]; x.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 - 6, bx, by); }
      x.lineTo(W + 20, bottom); x.fill();
      if (i === 2) {   // trees on the third ridge
        x.fillStyle = layers[3];
        for (let k = 0; k < 16; k++) { const tx = r() * W, ty = base - amp * .3 + r() * 40, th = 30 + r() * 40; x.beginPath(); x.moveTo(tx, ty - th); x.lineTo(tx + th * .35, ty); x.lineTo(tx - th * .35, ty); x.fill(); }
      }
    });
    const pr = bottom - (bottom - top) * .1;   // the near ridge
    x.fillStyle = night ? "#000" : "#2a1a20"; x.beginPath(); x.moveTo(0, pr + 20); x.quadraticCurveTo(W * .5, pr - 30, W, pr + 10); x.lineTo(W, bottom); x.lineTo(0, bottom); x.fill();
  }
  function sceneCity(x, top, bottom, kind) {
    const hz = bottom - (bottom - top) * .12, night = kind !== "day", r = rng(55);
    sky(x, top, hz, kind);
    orb(x, W * .78, top + (hz - top) * .3, 44, kind);
    const back = night ? "#1d1117" : "#efc4d1", front = night ? "#2b1822" : "#c98aa0";
    for (let bx = -10; bx < W; ) { const bw = 40 + r() * 60, bh = 140 + r() * 260; building(x, bx, hz, bw, bh, back, night ? "rgba(255,230,200,.4)" : null, r, r() < .3); bx += bw + 4; }
    for (let bx = -20; bx < W; ) { const bw = 70 + r() * 70, bh = 80 + r() * 170; building(x, bx, hz, bw, bh, front, night ? "rgba(255,236,214,.8)" : null, r, r() < .5); bx += bw + 8; }
    x.fillStyle = night ? "#000" : "#2a1a20"; x.fillRect(0, hz, W, bottom - hz);
    stripe(x, hz, bottom, night);
  }
  function stripe(x, top, bottom, night) {   // lane lines on the road
    x.strokeStyle = night ? "rgba(254,144,174,.5)" : "rgba(254,144,174,.8)"; x.lineWidth = 5; x.setLineDash([60, 40]);
    x.beginPath(); x.moveTo(0, bottom - 10); x.lineTo(W, bottom - 10); x.stroke(); x.setLineDash([]);
  }
  const SCENES = { marine: sceneMarine, worli: sceneWorli, hills: sceneHills, city: sceneCity };
  const PLACE_LABEL = { marine: "Marine Drive", worli: "Worli Sea Face", hills: "Kharghar Hills", city: "Mumbai" };

  function when(r) {
    const [y, m, d] = r.date.split("-").map(Number), [hh, mm] = String(r.time || "00:00").split(":").map(Number);
    const day = r.day || DAYS[new Date(y, m - 1, d).getDay()];
    return { day, date: d + " " + MONTHS[m - 1] + " " + y, short: d + " " + MONTHS[m - 1], time: (hh % 12 || 12) + ":" + String(mm).padStart(2, "0") + " " + (hh < 12 ? "AM" : "PM") };
  }
  function pin(x, px, py, s, col) {
    x.fillStyle = col; x.beginPath(); x.arc(px, py, s * .5, Math.PI, 0); x.lineTo(px, py + s * .95); x.closePath(); x.fill();
    x.fillStyle = INK; x.beginPath(); x.arc(px, py, s * .2, 0, Math.PI * 2); x.fill();
  }
  function chip(x, text, cx, cy, bg, fg, align) {
    x.font = "700 36px " + C; const t = spaced(text), w = x.measureText(t).width + 52;
    const left = align === "right" ? cx - w : cx;
    x.fillStyle = bg; x.beginPath(); x.roundRect(left, cy - 32, w, 64, 32); x.fill();
    x.fillStyle = fg; x.textAlign = "left"; x.textBaseline = "middle"; x.fillText(t, left + 26, cy + 2); x.textBaseline = "alphabetic";
  }

  // ---- Instagram story: no QR code ----
  async function story(r, name) {
    await fonts();
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"), theme = themeOf(r.start), kind = skyOf(r.time), w = when(r);
    x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
    // words first (measured), then the scene fills the space below them
    let size = 150; x.font = "italic 800 " + size + "px " + C;
    let title = wrap(x, r.name.toUpperCase(), W - 160);
    while (title.length > 3 && size > 96) { size -= 8; x.font = "italic 800 " + size + "px " + C; title = wrap(x, r.name.toUpperCase(), W - 160); }
    const lines = Math.min(3, title.length), sceneTop = Math.max(1010, 470 + size * .95 + (lines - 1) * size * .9 + 200), foot = 1660;
    SCENES[theme](x, sceneTop - 40, foot, kind);
    const fade = x.createLinearGradient(0, sceneTop - 60, 0, sceneTop + 260); fade.addColorStop(0, "#000"); fade.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = fade; x.fillRect(0, sceneTop - 60, W, 320);
    x.fillStyle = "#000"; x.fillRect(0, 0, W, sceneTop - 59); x.fillRect(0, foot, W, H - foot);
    x.save(); x.strokeStyle = "rgba(254,144,174,.14)"; x.lineWidth = 4;   // track lanes behind the words
    for (let i = -1100; i < W; i += 70) { x.beginPath(); x.moveTo(i, sceneTop); x.lineTo(i + sceneTop * .53, 0); x.stroke(); }
    x.restore();
    const logo = await loadImg("logo.png");
    if (logo) x.drawImage(logo, 80, 90, 150, 150);
    chip(x, "RACE DAY", W - 80, 165, PINK, "#000", "right");
    const nm = String(name || "").toUpperCase();
    x.textAlign = "left"; x.fillStyle = "rgba(255,255,255,.8)"; fit(x, spaced(nm), "700 #px " + B, 40, W - 160, 26); x.fillText(spaced(nm), 80, 360);
    x.fillStyle = "#fff"; x.font = "italic 800 92px " + C; x.fillText("I'M RUNNING", 80, 460);
    x.font = "italic 800 " + size + "px " + C;
    x.fillStyle = PINK; let y = 460 + size * .95;
    title.slice(0, 3).forEach((l) => { x.fillText(l, 80, y); y += size * .9; });
    y += 20;
    x.fillStyle = "#fff"; x.font = "700 46px " + B; x.fillText(w.day + ", " + w.date, 80, y);
    x.fillStyle = PINK; x.fillText("  ·  " + w.time, 80 + x.measureText(w.day + ", " + w.date).width, y);
    y += 66; pin(x, 100, y - 30, 40, PINK);
    x.fillStyle = "rgba(255,255,255,.85)"; x.font = "500 42px " + B;
    x.fillText(wrap(x, r.start || PLACE_LABEL[theme], W - 330)[0], 140, y);
    if (r.distance) {   // distance badge
      const bx = W - 170, by = y - 30;
      x.fillStyle = PINK; x.beginPath(); x.arc(bx, by, 92, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "#000"; x.lineWidth = 5; x.beginPath(); x.arc(bx, by, 78, 0, Math.PI * 2); x.stroke();
      x.fillStyle = "#000"; x.textAlign = "center"; x.font = "italic 800 84px " + C; x.fillText(r.distance + "K", bx, by + 28); x.textAlign = "left";
    }
    // the club tag under the road
    x.textAlign = "center"; x.fillStyle = PINK; x.font = "italic 800 72px " + C; x.fillText("@UNBNDRUNCLUB", W / 2, foot + 100);
    x.fillStyle = "rgba(255,255,255,.6)"; x.font = "700 30px " + B; x.fillText(spaced("RUN UNBOUND · MUMBAI"), W / 2, foot + 150);
    x.textAlign = "left";
    return c;
  }

  // ---- The race card itself: the ticket, with the QR code ----
  // qr: a qrcode-generator object (or null when the code couldn't be made)
  async function ticket(r, clubId, name, qr) {
    await fonts();
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"), theme = themeOf(r.start), kind = skyOf(r.time), w = when(r);
    const L = 40, T = 40, R = W - 40, Bm = H - 40, split = 800, rad = 44;
    x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
    x.save(); x.strokeStyle = "rgba(254,144,174,.25)"; x.lineWidth = 4;
    for (let i = -H; i < W + H; i += 70) { x.beginPath(); x.moveTo(i, H); x.lineTo(i + H * .53, 0); x.stroke(); }
    x.restore();
    // ticket outline with notches at the tear line
    const shape = () => { x.beginPath(); x.roundRect(L, T, R - L, Bm - T, rad); };
    x.save(); shape(); x.clip();
    x.fillStyle = "#fff"; x.fillRect(L, T, R - L, Bm - T);
    x.save(); x.beginPath(); x.rect(L, T, R - L, split - T); x.clip();
    x.fillStyle = "#000"; x.fillRect(L, T, R - L, split - T);
    let size = 104; x.font = "italic 800 " + size + "px " + C;
    let title = wrap(x, r.name.toUpperCase(), R - L - 88);
    while (title.length > 2 && size > 76) { size -= 6; x.font = "italic 800 " + size + "px " + C; title = wrap(x, r.name.toUpperCase(), R - L - 88); }
    title = title.slice(0, 3);
    const titleY = T + 180 + size * .8, dateY = titleY + title.length * size * .9 + 8, sTop = dateY + 30;
    x.save(); x.beginPath(); x.rect(L, sTop, R - L, split - sTop); x.clip();
    SCENES[theme](x, sTop, split, kind); x.restore();
    const shade = x.createLinearGradient(0, sTop, 0, sTop + 140); shade.addColorStop(0, "#000"); shade.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = shade; x.fillRect(L, sTop, R - L, 140);
    x.restore();
    x.globalCompositeOperation = "destination-out";
    [L, R].forEach((nx) => { x.beginPath(); x.arc(nx, split, 36, 0, Math.PI * 2); x.fill(); });
    x.globalCompositeOperation = "source-over";
    x.restore();
    x.strokeStyle = "#cfc6ca"; x.lineWidth = 4; x.setLineDash([18, 16]); x.beginPath(); x.moveTo(L + 56, split); x.lineTo(R - 56, split); x.stroke(); x.setLineDash([]);
    // top: logo, label, race
    const logo = await loadImg("logo.png");
    if (logo) x.drawImage(logo, L + 44, T + 40, 120, 120);
    chip(x, "RACE CARD", R - 44, T + 100, PINK, "#000", "right");
    x.textAlign = "left";
    x.font = "italic 800 " + size + "px " + C; x.fillStyle = "#fff";
    title.forEach((l, i) => x.fillText(l, L + 44, titleY + i * size * .9));
    x.font = "700 40px " + B; x.fillStyle = PINK; x.fillText(w.day + ", " + w.date + "  ·  " + w.time, L + 44, dateY);
    // bottom: who, the code, the terms
    const lx = L + 60, rw = R - L - 120;
    let by = split + 76;
    x.fillStyle = "#77707a"; x.font = "700 26px " + B; x.fillText(spaced("REGISTERED RUNNER"), lx, by);
    const nm = String(name || "").toUpperCase();
    fit(x, nm, "italic 800 #px " + C, 92, rw, 52); x.fillStyle = INK; x.fillText(nm, lx, by + 84);
    by += 130;
    const cells = [["CLUB ID", clubId], ["DISTANCE", r.distance ? r.distance + " KM" : "–"], ["START", w.time]];
    const cw = rw / 3;
    cells.forEach(([k, v], i) => {
      const cx = lx + i * cw;
      if (i) { x.fillStyle = "#e3dde0"; x.fillRect(cx - 18, by - 6, 3, 92); }
      x.fillStyle = "#77707a"; x.font = "700 24px " + B; x.fillText(spaced(k), cx, by + 22);
      x.fillStyle = i === 0 ? "#000" : INK; fit(x, v, "italic 800 #px " + C, 64, cw - 36, 40); x.fillText(v, cx, by + 82);
    });
    by += 120;
    // terms first, measured, so the code gets whatever room is left
    const tw = rw - 40, who = String(name || "the registered member");
    x.font = "500 25px " + B;
    const t1 = wrap(x, "NON-TRANSFERABLE. Only " + who + " (Club ID " + clubId + "), the registered member, may use this race card.", tw);
    const t2 = wrap(x, "You may be asked by the organisers to show a valid government photo ID to confirm your identity.", tw);
    const termsH = 40 + (t1.length + t2.length) * 34 + 12, termsTop = Bm - 34 - termsH;
    const qTop = by, qSize = Math.min(480, termsTop - 120 - by);
    if (qr) {   // black on white with a 4-module quiet zone
      const n = qr.getModuleCount(), cell = Math.floor(qSize / (n + 8)), qs = cell * (n + 8), qx = (W - qs) / 2, qy = qTop + (qSize - qs) / 2;
      x.strokeStyle = INK; x.lineWidth = 6; x.beginPath(); x.roundRect(qx - 10, qy - 10, qs + 20, qs + 20, 28); x.stroke();
      x.fillStyle = "#fff"; x.fillRect(qx, qy, qs, qs); x.fillStyle = "#000";
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (qr.isDark(i, j)) x.fillRect(qx + (j + 4) * cell, qy + (i + 4) * cell, cell, cell);
    } else {
      x.fillStyle = "#f4f0f2"; x.beginPath(); x.roundRect((W - qSize) / 2, qTop, qSize, qSize, 28); x.fill();
      x.fillStyle = "#77707a"; x.textAlign = "center"; x.font = "600 34px " + B;
      wrap(x, "Show this race card and your Club ID at the start line.", qSize - 80).forEach((l, i) => x.fillText(l, W / 2, qTop + qSize / 2 - 20 + i * 46));
      x.textAlign = "left";
    }
    by = termsTop - 66;
    x.textAlign = "center"; x.fillStyle = INK; x.font = "700 34px " + B;
    x.fillText("Valid for " + r.id + " on " + w.date + " only", W / 2, by);
    x.fillStyle = "#77707a"; x.font = "500 28px " + B; x.fillText("Show this code at the start line", W / 2, by + 42);
    x.textAlign = "left";
    x.fillStyle = "#fde8ee"; x.beginPath(); x.roundRect(lx - 16, termsTop, rw + 32, termsH, 20); x.fill();
    let ty = termsTop + 44;
    t1.forEach((l, i) => {
      if (i === 0 && l.startsWith("NON-TRANSFERABLE.")) { x.font = "800 25px " + B; x.fillStyle = "#000"; x.fillText("NON-TRANSFERABLE.", lx, ty); const off = x.measureText("NON-TRANSFERABLE. ").width; x.font = "500 25px " + B; x.fillStyle = "#2b2730"; x.fillText(l.slice(18), lx + off, ty); }
      else { x.font = "500 25px " + B; x.fillStyle = "#2b2730"; x.fillText(l, lx, ty); }
      ty += 34;
    });
    ty += 8; x.font = "500 25px " + B; x.fillStyle = "#2b2730";
    t2.forEach((l) => { x.fillText(l, lx, ty); ty += 34; });
    return c;
  }
  window.UNBNDCard = { story, ticket, themeOf, skyOf };
})();
