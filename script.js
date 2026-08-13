/* =====================================================================
   LUXE GLOSS & SPA — INTERACTIVE MECHANICS
   Mobile menu · smooth scroll · tabbed service filters · accordions ·
   carousels · booking form validation · WhatsApp booking redirects
===================================================================== */
(function () {
  "use strict";

  /* ---------------- WhatsApp number + base helper ---------------- */
  var WA_NUMBER = "2348124294170"; // international, no '+'

  // Build a wa.me link with a pre-filled message.
  function waLink(message) {
    return (
      "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message)
    );
  }

  /* =================================================================
     STICKY HEADER SCROLL STATE
  ================================================================== */
  var header = document.getElementById("siteHeader");
  var onScroll = function () {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* =================================================================
     MOBILE DRAWER
  ================================================================== */
  var navToggle = document.getElementById("navToggle");
  var drawer = document.getElementById("mobileDrawer");
  var drawerClose = document.getElementById("drawerClose");
  var drawerScrim = document.getElementById("drawerScrim");

  function setDrawer(open) {
    if (!drawer || !drawerScrim || !navToggle) return;
    drawer.classList.toggle("is-open", open);
    drawerScrim.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  }
  function closeDrawer() {
    setDrawer(false);
  }

  if (navToggle)
    navToggle.addEventListener("click", function () {
      setDrawer(drawer.classList.contains("is-open") ? false : true);
    });
  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (drawerScrim) drawerScrim.addEventListener("click", closeDrawer);

  /* Close drawer when a drawer nav link is tapped */
  var drawerLinks = drawer ? drawer.querySelectorAll("a") : [];
  Array.prototype.forEach.call(drawerLinks, function (a) {
    a.addEventListener("click", closeDrawer);
  });

  /* Escape closes drawer */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("is-open"))
      closeDrawer();
  });

  /* =================================================================
     SMOOTH SECTION SCROLLING (native + offset for sticky header)
  ================================================================== */
  document.addEventListener("click", function (e) {
    var anchor = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!anchor) return;
    var id = anchor.getAttribute("href");
    if (id.length <= 1) return; // bare '#'
    var target = document.getElementById(id.slice(1));
    if (!target) return;

    e.preventDefault();
    var headerH = header ? header.offsetHeight : 0;
    var y =
      target.getBoundingClientRect().top + window.pageYOffset - headerH - 14;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  });

  /* =================================================================
     SERVICE TABS (tabbed filters)
  ================================================================== */
  var tabs = document.getElementById("serviceTabs");
  var services = document.querySelectorAll(".service");
  var tabEmpty = document.getElementById("tabEmpty");

  if (tabs) {
    var tabButtons = tabs.querySelectorAll(".tab");
    Array.prototype.forEach.call(tabButtons, function (tab) {
      tab.addEventListener("click", function () {
        // update active state on the tab bar
        Array.prototype.forEach.call(tabButtons, function (t) {
          var active = t === tab;
          t.classList.toggle("is-active", active);
          t.setAttribute("aria-selected", String(active));
        });

        var filter = tab.getAttribute("data-filter");
        var visibleCount = 0;
        Array.prototype.forEach.call(services, function (svc) {
          var match =
            filter === "all" || svc.getAttribute("data-cat") === filter;
          svc.classList.toggle("is-hidden", !match);
          if (match) visibleCount++;
        });

        if (tabEmpty) tabEmpty.hidden = visibleCount !== 0;
      });
    });
  }

  /* =================================================================
     SERVICE ACCORDIONS
  ================================================================== */
  Array.prototype.forEach.call(services, function (svc) {
    var head = svc.querySelector(".service-head");
    if (!head) return;
    head.addEventListener("click", function () {
      var isOpen = svc.classList.contains("is-open");
      // Close any other open accordion for a tidy, calm reveal
      Array.prototype.forEach.call(services, function (s) {
        if (s !== svc && s.classList.contains("is-open")) {
          s.classList.remove("is-open");
          var h = s.querySelector(".service-head");
          if (h) h.setAttribute("aria-expanded", "false");
        }
      });
      svc.classList.toggle("is-open", !isOpen);
      head.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  /* =================================================================
     GENERIC CAROUSEL ENGINE
  ================================================================== */
  function makeCarousel(trackEl, prevEl, nextEl, dotsEl, opts) {
    if (!trackEl) return null;
    var slides = trackEl.children;
    if (!slides.length) return null;
    var index = 0;
    var timer = null;

    function go(i, user) {
      var n = slides.length;
      index = ((i % n) + n) % n;
      trackEl.style.transform = "translateX(-" + index * 100 + "%)";
      // dots
      if (dotsEl) {
        Array.prototype.forEach.call(dotsEl.children, function (d, di) {
          d.classList.toggle("is-active", di === index);
          d.setAttribute("aria-selected", String(di === index));
        });
      }
      if (opts && typeof opts.onChange === "function") opts.onChange(index);
    }

    function buildDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = "";
      Array.prototype.forEach.call(slides, function (_, i) {
        var b = document.createElement("button");
        b.setAttribute("role", "tab");
        b.setAttribute("aria-label", "Go to slide " + (i + 1));
        b.addEventListener("click", function () {
          go(i, true);
          reset();
        });
        dotsEl.appendChild(b);
      });
    }

    function prev() {
      go(index - 1, true);
      reset();
    }
    function next() {
      go(index + 1, true);
      reset();
    }

    function start() {
      if (opts && opts.autoplay) {
        timer = setInterval(function () {
          go(index + 1, false);
        }, opts.autoplay);
      }
    }
    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    function reset() {
      stop();
      if (opts && opts.autoplay) start();
    }

    if (prevEl) prevEl.addEventListener("click", prev);
    if (nextEl) nextEl.addEventListener("click", next);

    // pause on hover / touch to be considerate
    trackEl.addEventListener("mouseenter", stop);
    trackEl.addEventListener("mouseleave", function () {
      if (opts && opts.autoplay) start();
    });

    buildDots();
    go(0, true);
    start();

    // keyboard navigation
    trackEl.setAttribute("tabindex", "0");
    trackEl.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    });

    return {
      next: next,
      prev: prev,
      go: go,
      reset: reset,
      getIndex: function () {
        return index;
      },
    };
  }

  /* Gallery carousel (autoplay, wabi-sabi imagery) */
  makeCarousel(
    document.getElementById("galleryTrack"),
    document.getElementById("galleryPrev"),
    document.getElementById("galleryNext"),
    document.getElementById("galleryDots"),
    { autoplay: 5000 },
  );

  /* Testimonials carousel */
  makeCarousel(
    document.getElementById("testiTrack"),
    document.getElementById("testiPrev"),
    document.getElementById("testiNext"),
    document.getElementById("testiDots"),
    { autoplay: 7000 },
  );

  /* =================================================================
     BOOKING FORM VALIDATION + WHATSAPP REDIRECT
  ================================================================== */
  var form = document.getElementById("bookingForm");
  var submitBtn = document.getElementById("submitBtn");
  if (form) {
    var fields = {
      name: form.querySelector("#bf-name"),
      phone: form.querySelector("#bf-phone"),
      service: form.querySelector("#bf-service"),
      date: form.querySelector("#bf-date"),
      time: form.querySelector("#bf-time"),
      notes: form.querySelector("#bf-notes"),
    };

    function setError(name, msg) {
      var field = fields[name];
      if (!field) return;
      var wrap = field.closest(".field");
      var errEl = wrap ? wrap.querySelector(".err") : null;
      if (wrap) wrap.classList.toggle("has-error", Boolean(msg));
      if (errEl) {
        errEl.textContent = msg || "";
        errEl.classList.toggle("show", Boolean(msg));
      }
      return !msg;
    }

    function validatePhone(value) {
      var digits = value.replace(/[^0-9+]/g, "");
      return /^(\+?\d{10,15})$/.test(digits);
    }

    // live validation clearing on input
    Object.keys(fields).forEach(function (key) {
      var f = fields[key];
      if (!f) return;
      var ev = f.tagName === "SELECT" ? "change" : "input";
      f.addEventListener(ev, function () {
        setError(key, "");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var clean = true;

      var name = fields.name.value.trim();
      clean =
        setError(
          "name",
          name.length >= 2 ? "" : "Please enter your full name.",
        ) && clean;

      var phone = fields.phone.value.trim();
      clean =
        setError(
          "phone",
          validatePhone(phone)
            ? ""
            : "Enter a valid phone number, e.g. +234 812 429 4170.",
        ) && clean;

      var service = fields.service.value;
      clean =
        setError("service", service ? "" : "Please choose a service.") && clean;

      var date = fields.date.value;
      clean =
        setError("date", date ? "" : "Please pick a preferred date.") && clean;

      var time = fields.time.value;
      clean =
        setError("time", time ? "" : "Please pick a preferred time.") && clean;

      if (!clean) {
        // focus the first invalid field
        var firstErr = form.querySelector(
          ".field.has-error input, .field.has-error select",
        );
        if (firstErr) firstErr.focus();
        return;
      }

      // Build the WhatsApp message
      var prettyDate = date
        ? new Date(date + "T00:00:00").toLocaleDateString("en-NG", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "to be confirmed";

      var msg = [
        "Hello Luxe Gloss & Spa, I would like to book an appointment.",
        "",
        "• Name: " + name,
        "• Phone: " + phone,
        "• Service: " + service,
        "• Date: " + prettyDate,
        "• Time: " + time,
      ];
      if (fields.notes.value.trim()) {
        msg.push("• Notes: " + fields.notes.value.trim());
      }
      msg.push("", "Please confirm my reservation. Thank you!");

      var busy = false;
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.disabled = true;
        busy = true;
        submitBtn.textContent = "Opening WhatsApp…";
      }

      // Slight delay so the button state reads, then redirect.
      setTimeout(function () {
        window.open(waLink(msg.join("\n")), "_blank", "noopener");
        if (busy && submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Reserve via WhatsApp";
        }
      }, 450);
    });
  }

  /* =================================================================
     DIRECT WHATSAPP BOOKING (pre-filled, 1-tap)
     Any element with class "wa-book" and a data-service / data-msg
  ================================================================== */
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest(".wa-book") : null;
    if (!el) return;
    e.preventDefault();
    var service = el.getAttribute("data-service") || "a service";
    var custom = el.getAttribute("data-msg");
    var message =
      custom || "Hello Luxe Gloss & Spa, I would like to book " + service + ".";
    window.open(waLink(message), "_blank", "noopener");
  });

  /* =================================================================
     FOOTER YEAR
  ================================================================== */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
