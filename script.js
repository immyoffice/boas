/* =========================================================
   English Club Presentation — Boas Sababang (251134146)
   Navigation · language switch · YouTube subtitle lab
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Elements ---------- */
  var deck      = document.getElementById('deck');
  var slides    = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var dotsWrap  = document.getElementById('dots');
  var progress  = document.getElementById('progressBar');
  var curNum    = document.getElementById('curNum');
  var totalNum  = document.getElementById('totalNum');
  var btnPrev   = document.getElementById('btnPrev');
  var btnNext   = document.getElementById('btnNext');
  var btnFull   = document.getElementById('btnFull');

  var player      = document.getElementById('ytPlayer');
  var playerTitle = document.getElementById('playerTitle');
  var playlist    = document.getElementById('playlist');
  var urlInput    = document.getElementById('urlInput');
  var urlMsg      = document.getElementById('urlMsg');
  var loadBtn     = document.getElementById('loadBtn');

  var total = slides.length;
  var index = 0;
  var videoLoaded = false;
  var DEFAULT_VIDEO = 'q4MhP5Kq3X8';

  totalNum.textContent = String(total).padStart(2, '0');

  /* ---------- Build dot indicators ---------- */
  slides.forEach(function (slide, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label',
      'Slide ' + (i + 1) + (slide.dataset.title ? ' — ' + slide.dataset.title : ''));
    b.addEventListener('click', function () { go(i); });
    dotsWrap.appendChild(b);
  });
  var dots = Array.prototype.slice.call(dotsWrap.children);

  /* ---------- Navigation ---------- */
  function go(next, opts) {
    var target = Math.max(0, Math.min(total - 1, next));
    if (target === index && !(opts && opts.force)) return;

    pauseVideo();

    slides[index].classList.remove('is-active');
    slides[index].setAttribute('aria-hidden', 'true');

    index = target;
    var slide = slides[index];
    slide.classList.add('is-active');
    slide.removeAttribute('aria-hidden');
    slide.scrollTop = 0;

    /* progress + counter + dots */
    progress.style.width = ((index + 1) / total * 100) + '%';
    curNum.textContent = String(index + 1).padStart(2, '0');
    dots.forEach(function (d, i) { d.classList.toggle('is-on', i === index); });

    btnPrev.disabled = index === 0;
    btnNext.disabled = index === total - 1;

    if (history.replaceState) {
      history.replaceState(null, '', '#slide-' + (index + 1));
    }

    /* lazily mount the YouTube player when its slide appears */
    if (slide.id === 'slide-10' && !videoLoaded) {
      loadVideo(DEFAULT_VIDEO, 'At the Coffee Shop — Shadowing Practice', false);
    }
  }

  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  document.getElementById('brand').addEventListener('click', function (e) {
    e.preventDefault();
    go(0);
  });

  /* ---------- Keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ':
        e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp':
        e.preventDefault(); prev(); break;
      case 'Home':
        e.preventDefault(); go(0); break;
      case 'End':
        e.preventDefault(); go(total - 1); break;
      case 'f': case 'F':
        toggleFull(); break;
      default: break;
    }
  });

  /* ---------- Touch swipe ---------- */
  var startX = 0, startY = 0, swiping = false;

  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { swiping = false; return; }
    var t = e.target;
    if (t && (t.closest('iframe') || t.tagName === 'INPUT')) { swiping = false; return; }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    swiping = true;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (!swiping) return;
    swiping = false;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    if (dx < 0) next(); else prev();
  }, { passive: true });

  /* ---------- Fullscreen ---------- */
  function toggleFull() {
    var el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    }
  }
  btnFull.addEventListener('click', toggleFull);

  /* ---------- Language switch ---------- */
  var langBtns = Array.prototype.slice.call(document.querySelectorAll('.lang-btn'));

  function setLang(lang, remember) {
    lang = lang === 'id' ? 'id' : 'en';
    document.body.classList.toggle('lang-en', lang === 'en');
    document.body.classList.toggle('lang-id', lang === 'id');
    document.documentElement.setAttribute('lang', lang);

    langBtns.forEach(function (b) {
      var on = b.dataset.lang === lang;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    if (remember !== false) {
      try { localStorage.setItem('bs-lang', lang); } catch (err) { /* ignore */ }
    }

    /* replay the entrance animations for the new content */
    var active = slides[index];
    active.classList.remove('is-active');
    void active.offsetWidth;
    active.classList.add('is-active');
  }

  langBtns.forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.lang); });
  });

  var saved = null;
  try { saved = localStorage.getItem('bs-lang'); } catch (err) { /* ignore */ }
  if (saved === 'id') setLang('id', false);

  /* ---------- YouTube player ---------- */
  function buildSrc(id) {
    return 'https://www.youtube.com/embed/' + id +
           '?rel=0&modestbranding=1&enablejsapi=1&cc_load_policy=1&cc_lang_pref=en&playsinline=1';
  }

  function loadVideo(id, title, autoplay) {
    if (!id) return;
    videoLoaded = true;
    player.src = buildSrc(id) + (autoplay ? '&autoplay=1' : '');
    playerTitle.textContent = title || id;

    Array.prototype.forEach.call(playlist.querySelectorAll('.v-item'), function (b) {
      b.classList.toggle('is-on', b.dataset.video === id);
    });
  }

  /* stop playback + sound when leaving the slide */
  function pauseVideo() {
    if (!videoLoaded || !player.contentWindow) return;
    try {
      player.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
    } catch (err) { /* ignore */ }
  }

  playlist.addEventListener('click', function (e) {
    var btn = e.target.closest('.v-item');
    if (!btn) return;
    loadVideo(btn.dataset.video, btn.dataset.title, true);
    note('');
  });

  /* ---------- Parse a pasted YouTube link ---------- */
  function parseYouTube(value) {
    var v = (value || '').trim();
    if (!v) return null;

    /* raw video id */
    if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;

    var id = null;
    var patterns = [
      /[?&]v=([A-Za-z0-9_-]{11})/,
      /youtu\.be\/([A-Za-z0-9_-]{11})/,
      /\/embed\/([A-Za-z0-9_-]{11})/,
      /\/shorts\/([A-Za-z0-9_-]{11})/,
      /\/live\/([A-Za-z0-9_-]{11})/
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = v.match(patterns[i]);
      if (m) { id = m[1]; break; }
    }
    return id;
  }

  function note(text, isError) {
    urlMsg.textContent = text;
    urlMsg.classList.toggle('is-err', !!isError);
  }

  var MSG_OK  = { en: 'Now playing in the player above.', id: 'Sedang diputar di pemutar di atas.' };
  var MSG_BAD = { en: 'Link not recognised. Example: https://youtu.be/VIDEO_ID',
                  id: 'Tautan tidak dikenali. Contoh: https://youtu.be/VIDEO_ID' };
  var currentNote = MSG_OK;

  function currentLang() {
    return document.body.classList.contains('lang-id') ? 'id' : 'en';
  }

  function applyNote(kind) {
    currentNote = kind;
    note(kind[currentLang()], kind === MSG_BAD);
  }

  function submitUrl() {
    var id = parseYouTube(urlInput.value);
    if (!id) { applyNote(MSG_BAD); return; }
    loadVideo(id, urlInput.value.trim() || id, true);
    applyNote(MSG_OK);
    urlInput.blur();
  }

  loadBtn.addEventListener('click', submitUrl);
  urlInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); submitUrl(); }
  });

  /* keep the status message in the active language */
  var langObserver = new MutationObserver(function () {
    note(currentNote[currentLang()], currentNote === MSG_BAD);
  });
  langObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ---------- Deep link + start ---------- */
  function fromHash() {
    var m = (location.hash || '').match(/slide-(\d+)/);
    if (!m) return 0;
    var n = parseInt(m[1], 10) - 1;
    return (n >= 0 && n < total) ? n : 0;
  }

  slides.forEach(function (s, i) {
    if (i !== 0) s.setAttribute('aria-hidden', 'true');
  });

  go(fromHash(), { force: true });
})();
