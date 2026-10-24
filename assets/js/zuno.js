/**
 * Zuno — animasi halaman (Motion, build browser di assets/vendor).
 * - Hero: masuk berurutan + maskot "pop".
 * - Setiap bagian: elemen muncul saat masuk layar (sekali saja).
 * - Grafis dashboard: batang terisi, cincin & panah tergambar, angka menghitung.
 * Semua dimatikan saat prefers-reduced-motion aktif; konten selalu tetap tampil.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var EASE = [0.16, 1, 0.3, 1];

  function showAll() {
    root.classList.remove("zjs");
    document.querySelectorAll(".zr-pre").forEach(function (el) { el.classList.remove("zr-pre"); });
  }

  /* "Pop" pakai properti CSS `scale` lewat WAAPI, supaya transform bawaan elemen
     (mis. translate(-50%, -50%)) tidak tertimpa. */
  function pop(el, delay, from) {
    if (!el.animate) return;
    el.animate([{ scale: String(from || 0.5), opacity: 0 }, { scale: "1", opacity: 1 }],
      { duration: 800, delay: (delay || 0) * 1000, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "backwards" });
  }

  function clearInline(el) {
    el.style.opacity = "";
    el.style.transform = "";
  }

  function onceInView(M, el, fn, amount) {
    if (typeof M.inView === "function") {
      var stop = M.inView(el, function () { fn(); stop(); }, { amount: amount || 0.15 });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { fn(); io.disconnect(); } });
    }, { threshold: amount || 0.15 });
    io.observe(el);
  }

  /* ── Hero ─────────────────────────────────────────────────────────────── */
  function hero(M) {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-hero]"));
    items.forEach(function (el, i) {
      M.animate(el, { opacity: [0, 1], transform: ["translateY(28px)", "translateY(0px)"] },
        { duration: 0.9, delay: 0.08 + i * 0.09, ease: EASE }).finished.then(function () { clearInline(el); });
    });
    var mascot = document.querySelector(".zhero__mascot");
    if (mascot) pop(mascot, 0.25, 0.6);
    document.querySelectorAll(".zorbit").forEach(function (el, i) { pop(el, 0.6 + i * 0.12, 0.4); });
  }

  /* ── Angka menghitung ─────────────────────────────────────────────────── */
  function counters(M) {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = Number(el.getAttribute("data-count"));
      el.textContent = "0";
      onceInView(M, el, function () {
        M.animate(0, target, { duration: 1.4, ease: EASE, onUpdate: function (v) { el.textContent = String(Math.round(v)); } });
      }, 0.6);
    });
  }

  /* ── Reveal umum untuk setiap bagian ──────────────────────────────────── */
  function revealTargets() {
    var sel = [
      "[data-r]",
      "main > section:not(.zhero) h2",
      "main > section:not(.zhero) .grid > *",
      "main > section:not(.zhero) article",
      "#roadmap-accordion > div",
      "main > section:not(.zhero) .rounded-3xl",
      "main > section:not(.zhero) .overflow-x-auto",
      "#radar .panel",
      "#radar .zradar-head"
    ].join(",");
    var list = Array.prototype.slice.call(document.querySelectorAll(sel));
    // buang elemen yang leluhurnya sudah ikut dianimasikan, supaya tidak dobel
    var set = new Set(list);
    return list.filter(function (el) {
      if (el.closest("[data-zdiv]")) return false;
      var p = el.parentElement;
      while (p) { if (set.has(p)) return false; p = p.parentElement; }
      return true;
    });
  }

  function reveal(M) {
    revealTargets().forEach(function (el) {
      el.classList.add("zr-pre");
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      onceInView(M, el, function () {
        el.classList.remove("zr-pre");
        M.animate(el, { opacity: [0, 1], transform: ["translateY(30px) scale(.985)", "translateY(0px) scale(1)"] },
          { duration: 0.85, delay: Math.min(sib, 6) * 0.07, ease: EASE }).finished.then(function () { clearInline(el); });
      }, 0.12);
    });
  }

  /* ── Divisi (gaya alur bertingkat) ────────────────────────────────────── */
  function divisions(M) {
    document.querySelectorAll("[data-zdiv]").forEach(function (row) {
      var copy = row.querySelector(".zdiv__copy");
      var plat = row.querySelector(".zplat");
      var right = row.classList.contains("zdiv--r");
      var lines = row.querySelectorAll(".zdiv__arrow path");
      [copy, plat].forEach(function (el) { el.classList.add("zr-pre"); });
      lines.forEach(function (p) { p.setAttribute("pathLength", "1"); p.style.strokeDasharray = "1"; p.style.strokeDashoffset = "1"; });
      onceInView(M, row, function () {
        copy.classList.remove("zr-pre");
        plat.classList.remove("zr-pre");
        M.animate(copy, { opacity: [0, 1], transform: [right ? "translateX(40px)" : "translateX(-40px)", "translateX(0px)"] },
          { duration: 0.9, ease: EASE }).finished.then(function () { clearInline(copy); });
        M.animate(plat, { opacity: [0, 1], transform: ["translateY(40px) scale(.9)", "translateY(0px) scale(1)"] },
          { duration: 1, delay: 0.12, ease: EASE }).finished.then(function () { clearInline(plat); });
        lines.forEach(function (p) {
          M.animate(p, { strokeDashoffset: [1, 0] }, { duration: 1.2, delay: 0.45, ease: "easeInOut" });
        });
      }, 0.25);
    });
  }

  /* ── Grafis dashboard ─────────────────────────────────────────────────── */
  function dashboards(M) {
    var run = document.querySelector(".zloop__run");
    var loop = document.querySelector(".zloop");
    if (loop && run) {
      var nodes = loop.querySelectorAll(".zloop__node");
      nodes.forEach(function (n) { n.style.opacity = "0"; });
      onceInView(M, loop, function () {
        M.animate(run, { strokeDashoffset: [258, 0] }, { duration: 2.2, ease: "easeInOut" });
        nodes.forEach(function (n, i) { n.style.opacity = ""; pop(n, 0.2 + i * 0.16, 0.4); });
      }, 0.35);
    }

    document.querySelectorAll(".zphases__list i, .zmini-flow__bar i").forEach(function (bar) {
      var s = parseFloat(getComputedStyle(bar).getPropertyValue("--s")) || 1;
      bar.style.transform = "scaleX(0)";
      onceInView(M, bar, function () {
        M.animate(bar, { transform: ["scaleX(0)", "scaleX(" + s + ")"] }, { duration: 1.3, ease: EASE });
      }, 0.5);
    });

    document.querySelectorAll(".zweeks, .ztrack, .zmem, .znext, .znever, .zchips, .zrank").forEach(function (group) {
      var kids = Array.prototype.slice.call(group.querySelectorAll(":scope > i, :scope > li"));
      kids.forEach(function (k) { k.style.opacity = "0"; });
      onceInView(M, group, function () {
        kids.forEach(function (k, i) {
          M.animate(k, { opacity: [0, 1], transform: ["translateY(12px) scale(.9)", "translateY(0px) scale(1)"] },
            { duration: 0.6, delay: i * (group.classList.contains("zweeks") ? 0.025 : 0.08), ease: EASE })
            .finished.then(function () { k.style.opacity = ""; k.style.transform = ""; });
        });
      }, 0.3);
    });
  }

  /* ── Tombol magnetik ──────────────────────────────────────────────────── */
  function magnetic() {
    if (!fine) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.2) + "px");
        el.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.3) + "px");
      });
      el.addEventListener("pointerleave", function () { el.style.setProperty("--mx", "0px"); el.style.setProperty("--my", "0px"); });
    });
  }

  /* ── Link navigasi aktif ──────────────────────────────────────────────── */
  function activeNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".znav-link"));
    var targets = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    var ticking = false;
    function update() {
      ticking = false;
      var mid = window.innerHeight * 0.35, current = -1, best = -Infinity;
      targets.forEach(function (t, i) {
        if (!t) return;
        var top = t.getBoundingClientRect().top;
        if (top <= mid && top > best) { best = top; current = i; }
      });
      links.forEach(function (a, i) { a.classList.toggle("is-active", i === current); });
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  function boot() {
    activeNav();
    var M = window.Motion;
    if (reduce || !M || typeof M.animate !== "function") { showAll(); return; }
    root.setAttribute("data-zanim", "ok");
    try {
      hero(M);
      counters(M);
      reveal(M);
      divisions(M);
      dashboards(M);
      magnetic();
    } catch (err) {
      console.error("[zuno] animasi dimatikan:", err);
      showAll();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
