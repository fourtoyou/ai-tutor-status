// วาดหน้าอวตารจาก look ใน tutor/personas.py — ใช้ทั้งหน้าเดโมเสียงและหน้าโชว์บนเว็บ
// drawAvatar(svg, look) คืน element ปาก ไว้ขยับตอนพูด (setAttribute("ry", ...))
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  // ผมด้านหน้า 3 ทรง
  const HAIR = {
    bangs: "M34 106 C28 18 172 18 166 106 C152 88 134 82 120 96 C110 82 90 82 80 96 C66 82 48 88 34 106 Z",
    short: "M36 100 C28 16 172 16 164 100 C152 74 126 64 100 66 C74 64 48 74 36 100 Z",
    side: "M34 108 C26 18 160 12 168 98 C142 74 108 72 78 90 C62 98 48 104 34 108 Z",
  };

  // ปากตอนหุบ: ยิ้มกว้าง / ยิ้มอ่อน / มุมปากยกนิด ๆ
  const SMILE = {
    sparkle: "M84 140 Q100 156 116 140",
    smile: "M88 142 Q100 152 112 142",
    calm: "M91 146 Q102 149 111 142",
  };

  function eyes(g, type, line) {
    for (const x of [76, 124]) {
      if (type === "smile") {
        el("path", { d: `M${x - 10} 112 Q${x} 101 ${x + 10} 112`, fill: "none", stroke: line,
          "stroke-width": 4, "stroke-linecap": "round" }, g);
      } else if (type === "calm") {
        el("ellipse", { cx: x, cy: 112, rx: 8, ry: 6, fill: line }, g);
        el("path", { d: `M${x - 11} 106 L${x + 11} 106`, stroke: line, "stroke-width": 3.5,
          "stroke-linecap": "round" }, g);
      } else {                                   // sparkle: ตากลมโต มีประกาย
        el("ellipse", { cx: x, cy: 110, rx: 9, ry: 11, fill: line }, g);
        el("circle", { cx: x + 3, cy: 106, r: 3.2, fill: "#fff" }, g);
        el("circle", { cx: x - 3, cy: 114, r: 1.4, fill: "#fff" }, g);
      }
    }
  }

  window.drawAvatar = function (svg, look) {
    const L = look.line, H = look.hair, F = look.face, A = look.accent;
    const extras = look.extras || [];
    svg.setAttribute("viewBox", "0 0 200 200");
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    el("circle", { cx: 100, cy: 100, r: 98, fill: A, "fill-opacity": 0.14 }, svg);
    if (look.hair_style === "bangs") {           // ผมยาวด้านหลัง
      el("path", { d: "M32 112 C26 46 174 46 168 112 L172 170 C150 182 50 182 28 170 Z", fill: H }, svg);
    }
    el("ellipse", { cx: 100, cy: 110, rx: 64, ry: 66, fill: F, stroke: L, "stroke-width": 3 }, svg);
    el("path", { d: HAIR[look.hair_style] || HAIR.short, fill: H, stroke: L, "stroke-width": 2 }, svg);

    const g = el("g", {}, svg);
    eyes(g, look.eyes, L);

    if (extras.includes("blush")) {
      for (const x of [60, 140]) el("ellipse", { cx: x, cy: 132, rx: 10, ry: 6, fill: A, "fill-opacity": 0.35 }, g);
    }
    if (extras.includes("glasses")) {
      for (const x of [76, 124]) el("circle", { cx: x, cy: 110, r: 16, fill: "none", stroke: L, "stroke-width": 3 }, g);
      el("path", { d: "M92 108 Q100 103 108 108", fill: "none", stroke: L, "stroke-width": 3 }, g);
    }
    if (extras.includes("clip")) {               // กิ๊บติดผม
      el("circle", { cx: 142, cy: 70, r: 9, fill: A, stroke: L, "stroke-width": 2 }, g);
      el("circle", { cx: 142, cy: 70, r: 3.5, fill: "#fff" }, g);
    }
    if (extras.includes("headphones")) {
      el("path", { d: "M32 112 C26 6 174 6 168 112", fill: "none", stroke: L, "stroke-width": 7,
        "stroke-linecap": "round" }, g);
      for (const x of [24, 162]) el("rect", { x, y: 98, width: 14, height: 32, rx: 6, fill: A, stroke: L,
        "stroke-width": 2.5 }, g);
    }

    const smile = el("path", { d: SMILE[look.eyes] || SMILE.smile, fill: "none", stroke: L, "stroke-width": 3.5,
      "stroke-linecap": "round" }, g);
    const mouth = el("ellipse", { cx: 100, cy: 146, rx: look.eyes === "calm" ? 9 : 12, ry: 0, fill: L }, g);
    mouth._smile = smile;
    return mouth;
  };

  // ขยับปากตอนพูด: เปิด = วงรี · ปิด = กลับไปยิ้ม
  window.setMouth = function (mouth, open) {
    if (!mouth) return;
    mouth.setAttribute("ry", open ? 9 : 0);
    if (mouth._smile) mouth._smile.style.display = open ? "none" : "";
  };
})();
