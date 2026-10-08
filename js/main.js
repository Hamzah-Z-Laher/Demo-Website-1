// RSNT Accounting — site scripts

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  var header = document.querySelector('.site-header');

  function setNavOpen(isOpen) {
    if (isOpen && header) {
      // Open the panel directly beneath the header, wherever it currently sits.
      nav.style.setProperty('--nav-top', header.getBoundingClientRect().bottom + 'px');
    }
    nav.classList.toggle('open', isOpen);
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setNavOpen(!nav.classList.contains('open'));
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setNavOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) setNavOpen(false);
    });
  }

  /* ---------- Header shadow + back-to-top ---------- */
  var toTop = document.querySelector('.to-top');
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 40);
    if (toTop) toTop.classList.toggle('show', y > 700);
    if (nav && nav.classList.contains('open') && header) {
      nav.style.setProperty('--nav-top', header.getBoundingClientRect().bottom + 'px');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---------- Reveal on scroll ---------- */
  // Siblings marked with data-stagger reveal one after another.
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    var step = parseFloat(group.getAttribute('data-stagger')) || 0.08;
    group.querySelectorAll(':scope > .reveal').forEach(function (el, i) {
      el.style.setProperty('--d', (i * step).toFixed(2) + 's');
    });
  });

  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Hero figure: start drawing once it is actually on screen ---------- */
  // On phones the figure sits below the fold, so a load-time animation
  // would finish before anyone scrolls down to see it.
  var heroFigure = document.querySelector('.hero-figure');
  if (heroFigure) {
    if ('IntersectionObserver' in window) {
      var figObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          heroFigure.classList.add('play');
          figObserver.disconnect();
        }
      }, { threshold: 0.4 });
      figObserver.observe(heroFigure);
    } else {
      heroFigure.classList.add('play');
    }
  }

  /* ---------- Active nav link ---------- */
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ---------- Services: expandable groups ---------- */
  var groups = document.querySelectorAll('.group');

  function setGroupOpen(group, isOpen) {
    group.classList.toggle('open', isOpen);
    var btn = group.querySelector('.group-btn');
    if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  // Open a group by id (from a link or a search result) and bring it into view.
  function revealGroup(id, scroll) {
    var group = document.getElementById(id);
    if (!group || !group.classList.contains('group')) return;
    setGroupOpen(group, true);
    group.classList.add('in');
    if (scroll) group.scrollIntoView({ behavior: 'smooth', block: 'start' });
    group.classList.remove('flash');
    void group.offsetWidth; // restart the highlight animation
    group.classList.add('flash');
  }

  if (groups.length) {
    groups.forEach(function (group) {
      var btn = group.querySelector('.group-btn');
      btn.addEventListener('click', function () {
        setGroupOpen(group, !group.classList.contains('open'));
      });
    });

    // Arriving from the homepage with #tax etc.: open that one instead of the first.
    var hash = window.location.hash.slice(1);
    // Snap to the final layout without animating, otherwise the closing groups
    // above shift the page after the browser has already jumped to the anchor.
    if (hash && document.getElementById(hash) && document.getElementById(hash).classList.contains('group')) {
      var rootEl = document.documentElement;
      rootEl.classList.add('no-group-anim');
      groups.forEach(function (g) { setGroupOpen(g, g.id === hash); });
      revealGroup(hash, false);
      document.getElementById(hash).scrollIntoView({ behavior: 'instant', block: 'start' });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { rootEl.classList.remove('no-group-anim'); });
      });
    }
    window.addEventListener('hashchange', function () {
      revealGroup(window.location.hash.slice(1), true);
    });
  }

  /* ---------- Services: "Check if we handle it" finder ---------- */
  var finderInput = document.getElementById('finder-q');
  var finderData = document.getElementById('finder-data');
  if (finderInput && finderData) {
    var entries = JSON.parse(finderData.textContent);
    var resultsEl = document.getElementById('finder-results');
    var groupNames = {};
    groups.forEach(function (g) { groupNames[g.id] = g.querySelector('h2').textContent; });

    function escapeHtml(s) {
      return s.replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    function highlight(text, q) {
      var lower = text.toLowerCase();
      var i = lower.indexOf(q);
      while (i > 0 && /[a-z0-9]/.test(lower[i - 1])) i = lower.indexOf(q, i + 1);
      if (i === -1) return escapeHtml(text);
      return escapeHtml(text.slice(0, i)) + '<mark>' + escapeHtml(text.slice(i, i + q.length)) + '</mark>' + escapeHtml(text.slice(i + q.length));
    }

    function runFinder() {
      var q = finderInput.value.trim().toLowerCase();
      if (q.length < 2) { resultsEl.innerHTML = ''; return; }
      // Each typed word must match the start of a word ("vat" finds VAT, not "private").
      var patterns = q.split(/\s+/).map(function (w) {
        return new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      });
      var matches = entries.filter(function (e) {
        var hay = (e[0] + ' ' + e[2] + ' ' + groupNames[e[1]]).toLowerCase();
        return patterns.every(function (p) { return p.test(hay); });
      }).slice(0, 6);

      if (!matches.length) {
        resultsEl.innerHTML = '<p>Not on our list, but we may still be able to help. <a href="contact.html">Ask us</a>.</p>';
        return;
      }
      resultsEl.innerHTML = matches.map(function (e) {
        return '<a href="#' + e[1] + '"><span>' + highlight(e[0], q) + '</span><small>' + escapeHtml(groupNames[e[1]]) + '</small></a>';
      }).join('');
    }

    finderInput.addEventListener('input', runFinder);
    resultsEl.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      e.preventDefault();
      revealGroup(link.getAttribute('href').slice(1), true);
    });
    document.querySelectorAll('.finder-hints button').forEach(function (b) {
      b.addEventListener('click', function () {
        finderInput.value = b.textContent;
        runFinder();
        finderInput.focus();
      });
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Contact form (opens the visitor's email client) ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var successBox = document.getElementById('form-success');

    function setFieldError(field, message) {
      var wrapper = field.closest('.field');
      if (!wrapper) return;
      var errorEl = wrapper.querySelector('.field-error');
      if (message) {
        wrapper.classList.add('invalid');
        field.setAttribute('aria-invalid', 'true');
        if (errorEl) errorEl.textContent = message;
      } else {
        wrapper.classList.remove('invalid');
        field.removeAttribute('aria-invalid');
      }
    }

    function validateForm() {
      var valid = true;
      var name = form.querySelector('#name');
      var email = form.querySelector('#email');
      var message = form.querySelector('#message');
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name.value.trim()) { setFieldError(name, 'Please enter your name.'); valid = false; }
      else setFieldError(name, null);

      if (!emailPattern.test(email.value.trim())) { setFieldError(email, 'Please enter a valid email address.'); valid = false; }
      else setFieldError(email, null);

      if (!message.value.trim()) { setFieldError(message, 'Please add a short message.'); valid = false; }
      else setFieldError(message, null);

      return valid;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm()) {
        var firstInvalid = form.querySelector('.invalid input, .invalid textarea');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var name = form.querySelector('#name').value.trim();
      var email = form.querySelector('#email').value.trim();
      var phone = form.querySelector('#phone').value.trim();
      var service = form.querySelector('#service').value;
      var message = form.querySelector('#message').value.trim();

      var subject = encodeURIComponent('Website enquiry: ' + (service || 'General'));
      var body = encodeURIComponent(
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Phone: ' + (phone || 'Not provided') + '\n' +
        'Service of interest: ' + (service || 'Not specified') + '\n\n' +
        'Message:\n' + message
      );

      if (successBox) successBox.classList.add('show');
      window.location.href = 'mailto:contact@rsnt.co.za?subject=' + subject + '&body=' + body;
      form.reset();
    });
  }
});
