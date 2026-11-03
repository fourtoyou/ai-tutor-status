// วาดอวตารสไตล์ VTuber จาก look ใน tutor/personas.py — ใช้ทั้งหน้าเดโมเสียงและหน้าโชว์บนเว็บ
// drawAvatar(svg, look) คืน element ปาก ไว้ขยับตอนพูด · setMouth(mouth, open) open = true/false หรือ 0..1
// ขยับเองตอนว่าง: กะพริบตา หายใจ หัวส่าย ผมไหว (CSS ใน <style id="av-css> ปิดอัตโนมัติถ้าผู้ใช้ตั้งลดการเคลื่อนไหว)
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  function css() {
    if (document.getElementById("av-css")) return;
    const s = document.createElement("style");
    s.id = "av-css";
    s.textContent = `
@keyframes av-blink{0%,91%,100%{transform:scaleY(1)}94%{transform:scaleY(.06)}}
@keyframes av-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(2.2px)}}
@keyframes av-sway{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.4deg)}}
@keyframes av-hair{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(1.2deg)}}
.av-eyes{transform-box:fill-box;transform-origin:center;animation:av-blink 4.6s infinite}
.av-body{animation:av-breathe 3.8s ease-in-out infinite}
.av-head{transform-origin:100px 165px;animation:av-sway 5.4s ease-in-out infinite}
.av-hair{transform-origin:100px 30px;animation:av-hair 4.2s ease-in-out infinite}
.av-tail-l{transform-origin:46px 100px;animation:av-hair 3.6s ease-in-out infinite}
.av-tail-r{transform-origin:154px 100px;animation:av-hair 3.6s ease-in-out infinite reverse}
@media (prefers-reduced-motion:reduce){.av-eyes,.av-body,.av-head,.av-hair,.av-tail-l,.av-tail-r{animation:none}}`;
    document.head.appendChild(s);
  }

  // ผมหน้า 3 ทรง (มีเส้นผมแยกเป็นปอย)
  const BANGS = {
    bangs: "M34 98 C30 40 66 24 100 24 C134 24 170 40 166 98 C156 78 142 66 126 70 C120 84 108 88 100 72 C92 88 80 84 74 70 C58 66 44 78 34 98 Z",
    short: "M36 100 C30 38 70 22 100 22 C132 22 172 38 164 100 C156 72 136 56 114 60 C98 54 66 62 36 100 Z",
    side: "M34 102 C28 42 68 22 104 24 C142 26 172 50 166 102 C160 80 144 62 122 62 C104 74 72 80 50 100 Z",
  };

  function shade(hex, k) {             // ผสมสีกับขาว/ดำ k>0 สว่างขึ้น k<0 เข้มขึ้น
    const n = parseInt(hex.slice(1), 16), t = k < 0 ? 0 : 255, p = Math.abs(k);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round((t - v) * p + v));
    return "#" + c.map(v => v.toString(16).padStart(2, "0")).join("");
  }

  function eye(g, x, type, line, iris, hairC) {
    if (type === "smile") {            // ตาหยี ยิ้มอ่อนโยน
      el("path", { d: `M${x - 12} 112 Q${x} 98 ${x + 12} 112`, fill: "none", stroke: line, "stroke-width": 4.2, "stroke-linecap": "round" }, g);
      return;
    }
    const half = type === "calm";
    const ry = half ? 10 : 15;
    el("ellipse", { cx: x, cy: 109, rx: 13.5, ry, fill: "#fff", stroke: line, "stroke-width": 1.2 }, g);
    el("ellipse", { cx: x, cy: 110, rx: 9.5, ry: ry - 1.5, fill: iris }, g);
    el("ellipse", { cx: x, cy: 112, rx: 5.5, ry: ry - 5, fill: shade(iris, -0.6) }, g);
    el("circle", { cx: x + 4, cy: 104, r: 3.6, fill: "#fff" }, g);
    el("circle", { cx: x - 4, cy: 116, r: 1.8, fill: "#fff", "fill-opacity": 0.9 }, g);
    // ขนตาบน หนา
    el("path", { d: `M${x - 15} ${half ? 104 : 100} Q${x} ${half ? 98 : 90} ${x + 15} ${half ? 104 : 100}`, fill: "none", stroke: line, "stroke-width": 3.6, "stroke-linecap": "round" }, g);
    if (half) {                        // เปลือกตาตก ชิล ๆ
      el("path", { d: `M${x - 14} 102 Q${x} 96 ${x + 14} 102 L${x + 14} 100 Q${x} 94 ${x - 14} 100 Z`, fill: line }, g);
    }
  }

  window.drawAvatar = function (svg, look) {
    css();
    const L = look.line, H = look.hair, F = look.face, A = look.accent;
    const extras = look.extras || [];
    const hs = look.hair_style || "short";
    const iris = look.iris || (hs === "bangs" ? "#E85D9A" : hs === "short" ? "#7A5230" : "#3F5BD8");
    svg.setAttribute("viewBox", "0 0 200 200");
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const defs = el("defs", {}, svg);
    const grad = el("radialGradient", { id: "avbg" + Math.random().toString(36).slice(2, 7), cx: "50%", cy: "35%", r: "75%" }, defs);
    el("stop", { offset: "0", "stop-color": shade(A, 0.75) }, grad);
    el("stop", { offset: "1", "stop-color": shade(A, 0.35) }, grad);
    el("circle", { cx: 100, cy: 100, r: 98, fill: `url(#${grad.id})`, "fill-opacity": 0.55 }, svg);

    const clip = el("clipPath", { id: grad.id + "c" }, defs);
    el("circle", { cx: 100, cy: 100, r: 98 }, clip);
    const root = el("g", { "clip-path": `url(#${clip.id})` }, svg);

    // ตัว + คอ (หายใจ)
    const body = el("g", { class: "av-body" }, root);
    el("path", { d: "M26 204 C30 172 60 160 84 158 L116 158 C140 160 170 172 174 204 Z", fill: shade(A, -0.1), stroke: L, "stroke-width": 2 }, body);
    el("path", { d: "M84 158 Q100 176 116 158 Q100 166 84 158 Z", fill: "#fff", "fill-opacity": 0.9 }, body);
    if (extras.includes("headphones")) {             // ฮู้ดดี้
      el("path", { d: "M70 160 Q100 184 130 160", fill: "none", stroke: shade(A, -0.35), "stroke-width": 5, "stroke-linecap": "round" }, body);
    }

    const head = el("g", { class: "av-head" }, root);
    if (hs === "bangs") {                              // ผมทวินเทล
      el("path", { class: "av-tail-l", d: "M50 96 C18 104 14 170 30 196 C46 186 56 150 58 112 Z", fill: H, stroke: L, "stroke-width": 2 }, head);
      el("path", { class: "av-tail-r", d: "M150 96 C182 104 186 170 170 196 C154 186 144 150 142 112 Z", fill: H, stroke: L, "stroke-width": 2 }, head);
    } else if (hs === "side") {
      el("path", { d: "M40 96 C30 130 44 150 60 142 L60 100 Z M160 96 C170 130 156 150 140 142 L140 100 Z", fill: H, stroke: L, "stroke-width": 2 }, head);
    }
    // คอ + หู + หน้า
    el("path", { d: "M88 140 L88 162 Q100 170 112 162 L112 140 Z", fill: F, stroke: L, "stroke-width": 2 }, head);
    el("path", { d: "M92 150 Q100 156 108 150 L108 156 Q100 162 92 156 Z", fill: L, "fill-opacity": 0.12 }, head);
    for (const x of [38, 162]) el("ellipse", { cx: x, cy: 112, rx: 7, ry: 11, fill: F, stroke: L, "stroke-width": 2 }, head);
    el("path", { d: "M40 98 C40 58 66 42 100 42 C134 42 160 58 160 98 C160 128 140 156 100 160 C60 156 40 128 40 98 Z", fill: F, stroke: L, "stroke-width": 2.4 }, head);

    // ใบหน้า
    const face = el("g", {}, head);
    for (const x of [58, 142]) el("ellipse", { cx: x, cy: 132, rx: 11, ry: 6.5, fill: extras.includes("blush") ? A : shade(F, -0.1), "fill-opacity": extras.includes("blush") ? 0.45 : 0.5 }, face);
    const eyes = el("g", { class: "av-eyes" }, face);
    eyes.style.animationDelay = (-Math.random() * 4).toFixed(2) + "s";
    eye(eyes, 74, look.eyes, L, iris, H);
    eye(eyes, 126, look.eyes, L, iris, H);
    for (const [x, s] of [[74, -1], [126, 1]]) {        // คิ้ว
      el("path", { d: `M${x - 13} ${look.eyes === "calm" ? 90 : 87} Q${x} ${look.eyes === "calm" ? 87 : 82} ${x + 13} ${look.eyes === "calm" ? 90 + s * 1 : 88}`, fill: "none", stroke: shade(H, -0.15), "stroke-width": 2.6, "stroke-linecap": "round" }, face);
    }
    el("path", { d: "M99 124 Q100 127 102 124", fill: "none", stroke: L, "stroke-opacity": 0.55, "stroke-width": 1.8, "stroke-linecap": "round" }, face);

    const SM = { sparkle: "M86 141 Q100 154 114 141", smile: "M89 142 Q100 151 111 142", calm: "M91 145 Q101 148 111 142" };
    const smile = el("path", { d: SM[look.eyes] || SM.smile, fill: "none", stroke: L, "stroke-width": 3.2, "stroke-linecap": "round" }, face);
    const mouth = el("ellipse", { cx: 100, cy: 144, rx: look.eyes === "calm" ? 8 : 10, ry: 0, fill: "#7C2D3F", stroke: L, "stroke-width": 1.6 }, face);
    mouth._smile = smile;

    // ผมหน้า (ไหวเบา ๆ)
    const hair = el("g", { class: "av-hair" }, head);
    el("path", { d: BANGS[hs] || BANGS.short, fill: H, stroke: L, "stroke-width": 2.2, "stroke-linejoin": "round" }, hair);
    el("path", { d: "M62 44 Q92 30 124 42", fill: "none", stroke: "#fff", "stroke-opacity": 0.35, "stroke-width": 5, "stroke-linecap": "round" }, hair);
    if (hs === "bangs") el("path", { d: "M100 26 C94 8 112 2 118 14", fill: "none", stroke: H, "stroke-width": 4, "stroke-linecap": "round" }, hair);
    if (hs === "short") el("path", { d: "M70 62 Q76 76 72 88 M130 62 Q124 76 128 88", fill: "none", stroke: L, "stroke-opacity": 0.35, "stroke-width": 1.8 }, hair);

    // ของประดับ
    if (extras.includes("glasses")) {
      for (const x of [74, 126]) el("ellipse", { cx: x, cy: 109, rx: 19, ry: 17, fill: "#fff", "fill-opacity": 0.12, stroke: L, "stroke-width": 3 }, head);
      el("path", { d: "M93 106 Q100 101 107 106", fill: "none", stroke: L, "stroke-width": 3 }, head);
    }
    if (extras.includes("clip")) {
      el("path", { d: "M138 60 l5 -9 l5 9 l-10 0 Z", fill: A, stroke: L, "stroke-width": 1.5 }, head);
      el("circle", { cx: 143, cy: 62, r: 7.5, fill: A, stroke: L, "stroke-width": 2 }, head);
      el("circle", { cx: 143, cy: 62, r: 3, fill: "#fff" }, head);
    }
    if (extras.includes("headphones")) {
      el("path", { d: "M34 108 C28 10 172 10 166 108", fill: "none", stroke: L, "stroke-width": 7, "stroke-linecap": "round" }, head);
      for (const x of [22, 164]) {
        el("rect", { x, y: 92, width: 14, height: 36, rx: 7, fill: A, stroke: L, "stroke-width": 2.5 }, head);
        el("rect", { x: x + 4, y: 100, width: 6, height: 20, rx: 3, fill: "#fff", "fill-opacity": 0.5 }, head);
      }
    }
    return mouth;
  };

  // ขยับปากตอนพูด: open true/false หรือ 0..1 · ปิด = กลับไปยิ้ม
  window.setMouth = function (mouth, open) {
    if (!mouth) return;
    const k = open === true ? 1 : open ? Math.max(0, Math.min(1, +open)) : 0;
    mouth.setAttribute("ry", k ? (3 + 6 * k).toFixed(1) : 0);
    if (mouth._smile) mouth._smile.style.display = k ? "none" : "";
  };
})();
