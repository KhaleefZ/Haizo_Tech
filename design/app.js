/* HaizoTech mockups — the small amount of behaviour needed to judge the design.
   In the real build this becomes Framer Motion + a sticky-header hook. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Sticky header gains a hairline + shadow once scrolled. */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Scroll reveal. Transform/opacity only, so it can't hurt LCP. */
  var revealables = document.querySelectorAll('.reveal, .reveal-l, .reveal-r, .reveal-media');
  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = Number(el.dataset.delay || 0);
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* Hero headline: staggered word fade-up, blue keyword last (REDESIGN.md §8). */
  document.querySelectorAll('.word').forEach(function (el, i) {
    el.style.animationDelay = (reduced ? 0 : i * 60) + 'ms';
  });
  document.querySelectorAll('.fade-up').forEach(function (el) {
    el.style.animationDelay = (reduced ? 0 : Number(el.dataset.delay || 0)) + 'ms';
  });

  /* Hero sparkline bars grow on load. */
  document.querySelectorAll('.spark span').forEach(function (bar, i) {
    bar.style.height = bar.dataset.h + '%';
    bar.style.animationDelay = (reduced ? 0 : 400 + i * 70) + 'ms';
  });

  /* Mobile nav — mockup-level only: reveal the links inline. */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.style.display === 'flex';
      nav.style.display = open ? '' : 'flex';
      nav.style.position = open ? '' : 'absolute';
      nav.style.cssText += open ? '' : ';top:72px;left:0;right:0;flex-direction:column;align-items:flex-start;gap:1rem;background:#fff;border-bottom:1px solid var(--color-border);padding:1.25rem;';
      toggle.setAttribute('aria-expanded', String(!open));
    });
  }

  /* Filter chips on the Work index. */
  var chips = document.querySelectorAll('[data-filter]');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      chip.setAttribute('aria-pressed', 'true');
      var want = chip.dataset.filter;
      document.querySelectorAll('[data-industry]').forEach(function (card) {
        var match = want === 'all' || card.dataset.industry === want;
        card.style.display = match ? '' : 'none';
      });
    });
  });

  /* Admin: sidebar collapse, tab switching, drawer toggles. */
  document.querySelectorAll('[data-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var group = btn.closest('[data-tabs]');
      if (!group) return;
      group.querySelectorAll('[data-tab]').forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
      btn.setAttribute('aria-selected', 'true');
      var target = btn.dataset.tab;
      group.querySelectorAll('[data-panel]').forEach(function (p) {
        p.hidden = p.dataset.panel !== target;
      });
    });
  });

  /* Scroll rails: fill as their section passes through the viewport. */
  var rails = document.querySelectorAll('.rail');
  if (rails.length) {
    var updateRails = function () {
      rails.forEach(function (rail) {
        var section = rail.closest('section') || rail.parentElement;
        if (!section) return;
        var box = section.getBoundingClientRect();
        var travelled = window.innerHeight - box.top;
        var total = box.height + window.innerHeight;
        var pct = Math.max(0, Math.min(1, travelled / total));
        var fill = rail.querySelector('.rail__fill');
        if (fill) fill.style.width = (pct * 100).toFixed(1) + '%';
      });
    };
    updateRails();
    window.addEventListener('scroll', updateRails, { passive: true });
    window.addEventListener('resize', updateRails, { passive: true });
  }
})();
