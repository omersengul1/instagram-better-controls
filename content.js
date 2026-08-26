(() => {
  const MARK = 'igNvc';
  const scrubbers = new Map();
  let nvcId = 0;
  let storyUi = null;

  const isStoriesPath = () => (location.pathname || '').startsWith('/stories/');
  const isReelsPath = () => /\/reels?(\/|$)/.test(location.pathname || '');

  const injectStyles = () => {
    if (document.getElementById('ig-nvc-styles')) return;
    const style = document.createElement('style');
    style.id = 'ig-nvc-styles';
    style.textContent = `
      .ig-nvc-bar {
        position: fixed;
        left: 0;
        right: auto;
        bottom: auto;
        top: 0;
        height: 14px;
        width: 0;
        z-index: 2147483647;
        cursor: pointer;
        pointer-events: auto;
        touch-action: none;
      }
      .ig-nvc-track {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        overflow: visible;
        background: rgba(0, 0, 0, 0.45);
        pointer-events: none;
        transition: height 0.12s ease;
      }
      .ig-nvc-fill {
        height: 100%;
        width: 100%;
        transform: scaleX(0);
        transform-origin: left center;
        will-change: transform;
        background: #e45a8c;
        pointer-events: none;
      }
      .ig-nvc-thumb {
        position: absolute;
        top: 50%;
        left: 0%;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #e45a8c;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.55);
        transform: translate(-50%, -50%);
        pointer-events: none;
        transition: width 0.12s ease, height 0.12s ease, opacity 0.12s ease;
      }
      .ig-nvc-bar:not(.ig-nvc-story) .ig-nvc-thumb {
        opacity: 0;
        width: 0;
        height: 0;
        box-shadow: none;
      }
      .ig-nvc-bar:hover .ig-nvc-track,
      .ig-nvc-bar.ig-nvc-hover .ig-nvc-track,
      .ig-nvc-bar.ig-nvc-drag .ig-nvc-track {
        height: 8px;
      }
      .ig-nvc-bar.ig-nvc-reels:hover .ig-nvc-track,
      .ig-nvc-bar.ig-nvc-reels.ig-nvc-hover .ig-nvc-track,
      .ig-nvc-bar.ig-nvc-reels.ig-nvc-drag .ig-nvc-track {
        height: 10px;
      }
      .ig-nvc-bar:not(.ig-nvc-story):hover .ig-nvc-thumb,
      .ig-nvc-bar:not(.ig-nvc-story).ig-nvc-strip-hover .ig-nvc-thumb,
      .ig-nvc-bar:not(.ig-nvc-story).ig-nvc-drag .ig-nvc-thumb {
        opacity: 1;
        width: 12px;
        height: 12px;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.55);
      }
      .ig-nvc-bar.ig-nvc-story:hover .ig-nvc-thumb,
      .ig-nvc-bar.ig-nvc-story.ig-nvc-hover .ig-nvc-thumb,
      .ig-nvc-bar.ig-nvc-story.ig-nvc-drag .ig-nvc-thumb {
        width: 12px;
        height: 12px;
      }
      .ig-nvc-bar.ig-nvc-reels {
        height: 18px;
      }
      .ig-nvc-bar.ig-nvc-story {
        position: fixed;
        top: 0;
        left: 0;
        right: auto;
        bottom: auto;
        height: 32px;
        width: 0;
      }
      .ig-nvc-bar.ig-nvc-story .ig-nvc-track {
        top: 0;
        bottom: auto;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.35);
      }
      .ig-nvc-bar.ig-nvc-story .ig-nvc-fill,
      .ig-nvc-bar.ig-nvc-story .ig-nvc-thumb {
        background: #ffffff;
      }
      .ig-nvc-dl {
        position: fixed;
        top: 0;
        left: 0;
        right: auto;
        z-index: 2147483647;
        width: 28px;
        height: 28px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.42);
        color: #fff;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        -webkit-tap-highlight-color: transparent;
      }
      .ig-nvc-dl:hover {
        background: rgba(0, 0, 0, 0.62);
      }
      .ig-nvc-dl svg {
        display: block;
        width: 15px;
        height: 15px;
      }
      html.ig-nvc-stories .ig-nvc-bar:not(.ig-nvc-story),
      html.ig-nvc-stories .ig-nvc-dl:not(.ig-nvc-story-dl) {
        display: none !important;
      }
      .ig-nvc-dl.ig-nvc-dl-busy {
        opacity: 0.5;
        pointer-events: none;
      }
      .ig-nvc-consent {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.45);
        font-family: system-ui, sans-serif;
      }
      .ig-nvc-consent-card {
        width: min(420px, calc(100vw - 32px));
        padding: 18px 18px 14px;
        border-radius: 14px;
        background: #101826;
        color: #e8eef7;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      }
      .ig-nvc-consent-card h2 {
        margin: 0 0 8px;
        font-size: 16px;
      }
      .ig-nvc-consent-card p {
        margin: 0 0 10px;
        font-size: 13px;
        line-height: 1.45;
        color: #c5d0df;
      }
      .ig-nvc-consent-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 12px;
      }
      .ig-nvc-consent-actions button {
        border: 0;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        font: 600 13px/1.2 system-ui, sans-serif;
      }
      .ig-nvc-consent-cancel {
        background: transparent;
        color: #c5d0df;
      }
      .ig-nvc-consent-ok {
        background: #e45a8c;
        color: #101826;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  };

  const visibleMediaBox = (el) => {
    if (!el || !el.isConnected) return null;
    const rect = el.getBoundingClientRect();
    let left = rect.left;
    let top = rect.top;
    let right = rect.right;
    let bottom = rect.bottom;
    if (right - left < 2 || bottom - top < 2) return null;
    let node = el.parentElement;
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      const ox = style.overflowX;
      const oy = style.overflowY;
      const clipped =
        ox === 'hidden' ||
        ox === 'auto' ||
        ox === 'scroll' ||
        oy === 'hidden' ||
        oy === 'auto' ||
        oy === 'scroll' ||
        (style.clipPath && style.clipPath !== 'none');
      if (clipped) {
        const cr = node.getBoundingClientRect();
        left = Math.max(left, cr.left);
        top = Math.max(top, cr.top);
        right = Math.min(right, cr.right);
        bottom = Math.min(bottom, cr.bottom);
      }
      node = node.parentElement;
    }
    left = Math.max(left, 0);
    top = Math.max(top, 0);
    right = Math.min(right, window.innerWidth);
    bottom = Math.min(bottom, window.innerHeight);
    const width = right - left;
    const height = bottom - top;
    if (width < 96 || height < 96) return null;
    return { left, top, right, bottom, width, height };
  };

  const playerRoot = (video) =>
    video.closest('article') || video.closest('[role="dialog"]') || video.parentElement;

  const primaryVideoInRoot = (video) => {
    const root = playerRoot(video);
    const list = root ? root.querySelectorAll('video') : [video];
    let best = null;
    let bestScore = -1;
    list.forEach((el) => {
      if (!(el instanceof HTMLVideoElement) || !el.isConnected) return;
      const box = visibleMediaBox(el);
      if (!box) return;
      let score = box.width * box.height;
      if (!el.paused && el.readyState >= 2) score += 1e9;
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    });
    return best;
  };

  const isPrimaryVisibleVideo = (video) => {
    if (isReelsPath()) {
      let best = null;
      let bestScore = -1;
      document.querySelectorAll('video').forEach((el) => {
        if (!(el instanceof HTMLVideoElement) || !el.isConnected) return;
        const box = visibleMediaBox(el);
        if (!box) return;
        let score = box.width * box.height;
        if (!el.paused && el.readyState >= 2) score += 1e9;
        const dx = box.left + box.width / 2 - window.innerWidth / 2;
        const dy = box.top + box.height / 2 - window.innerHeight / 2;
        score -= Math.abs(dx) + Math.abs(dy);
        if (score > bestScore) {
          bestScore = score;
          best = el;
        }
      });
      return best === video;
    }
    return primaryVideoInRoot(video) === video;
  };

  const isInScope = (video) => {
    if (!(video instanceof HTMLVideoElement)) return false;
    const path = location.pathname || '';
    if (path.startsWith('/stories/')) return false;
    if (/\/reels?(\/|$)/.test(path)) return true;
    if (/\/p\//.test(path)) return true;
    try {
      if (video.closest('article')) return true;
      if (video.closest('[role="dialog"]')) return true;
    } catch (_) {}
    const rect = video.getBoundingClientRect();
    return rect.width >= 180 && rect.height >= Math.min(window.innerHeight * 0.4, 320);
  };

  const isCenteredStory = (el) => {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 140 || rect.height < 180) return false;
    if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
    return Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2) < Math.min(140, window.innerWidth * 0.2);
  };

  const findStoryMedia = () => {
    if (!isStoriesPath()) return null;
    const vx = window.innerWidth / 2;
    let best = null;
    let bestScore = Infinity;
    document.querySelectorAll('video').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 140 || rect.height < 180) return;
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const dist = Math.abs(rect.left + rect.width / 2 - vx);
      let score = dist;
      if (!el.paused && el.readyState >= 2) score -= 4000;
      if (isFinite(el.duration) && el.duration > 0) score -= 400;
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    });
    if (best) return best;
    const root = document.querySelector('[role="dialog"]') || document;
    let bestImg = null;
    let bestImgDist = Infinity;
    root.querySelectorAll('img').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 140 || rect.height < 180) return;
      const dist = Math.abs(rect.left + rect.width / 2 - vx);
      if (dist < bestImgDist) {
        bestImgDist = dist;
        bestImg = el;
      }
    });
    return bestImg;
  };

  const tagMedia = (el) => {
    if (!el.dataset.igNvcId) el.dataset.igNvcId = `nvc${(nvcId += 1)}`;
    return el.dataset.igNvcId;
  };

  const DL_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>';

  const DOWNLOAD_ORIGINS = [
    'https://*.cdninstagram.com/*',
    'https://*.fbcdn.net/*',
  ];
  const CDN_HOST = /(^|\.)cdninstagram\.com$/i;
  const FBCDN_HOST = /(^|\.)fbcdn\.net$/i;
  const INSTAGRAM_ORIGIN = /^https:\/\/(www\.)?instagram\.com$/i;

  const isAllowedDownloadUrl = (urlStr) => {
    try {
      const url = new URL(urlStr);
      if (url.protocol !== 'https:') return false;
      return CDN_HOST.test(url.hostname) || FBCDN_HOST.test(url.hostname);
    } catch (_) {
      return false;
    }
  };

  let pendingSave = null;
  let consentOpen = false;

  const sendDownload = (url, filename) => {
    try {
      chrome.runtime.sendMessage({ type: 'seekstrip-download', url, filename }, () => {
        void chrome.runtime.lastError;
      });
    } catch (_) {}
  };

  const requestSavePermissions = async () => {
    try {
      return await chrome.permissions.request({
        permissions: ['downloads'],
        origins: DOWNLOAD_ORIGINS,
      });
    } catch (_) {
      try {
        chrome.runtime.sendMessage({ type: 'seekstrip-open-grant' });
      } catch (__) {}
      return false;
    }
  };

  const hideConsent = () => {
    const el = document.getElementById('ig-nvc-consent');
    if (el) el.remove();
    consentOpen = false;
  };

  const showConsent = () => {
    if (consentOpen) return;
    consentOpen = true;
    const wrap = document.createElement('div');
    wrap.id = 'ig-nvc-consent';
    wrap.className = 'ig-nvc-consent';
    wrap.innerHTML =
      '<div class="ig-nvc-consent-card" role="dialog" aria-modal="true" aria-labelledby="ig-nvc-consent-title">' +
      '<h2 id="ig-nvc-consent-title">Keep this video?</h2>' +
      '<p>Better Controls can keep the current video on your computer. Only keep content you have the right to keep.</p>' +
      '<p>The file is not sent to our servers. Chrome will ask you to pick a location.</p>' +
      '<div class="ig-nvc-consent-actions">' +
      '<button type="button" class="ig-nvc-consent-cancel">Cancel</button>' +
      '<button type="button" class="ig-nvc-consent-ok">Keep video</button>' +
      '</div></div>';
    wrap.addEventListener('click', (event) => {
      if (event.target === wrap) {
        pendingSave = null;
        hideConsent();
      }
    });
    wrap.querySelector('.ig-nvc-consent-cancel').addEventListener('click', () => {
      pendingSave = null;
      hideConsent();
    });
    wrap.querySelector('.ig-nvc-consent-ok').addEventListener('click', async () => {
      const granted = await requestSavePermissions();
      if (!granted) {
        hideConsent();
        return;
      }
      await chrome.storage.local.set({ seekstripConsent: true });
      hideConsent();
      if (pendingSave) tryFlushSave();
      else {
        try {
          window.postMessage({ source: 'ig-nvc', type: 'need-url' }, window.location.origin);
        } catch (_) {}
      }
    });
    (document.body || document.documentElement).appendChild(wrap);
  };

  const tryFlushSave = () => {
    if (!pendingSave) return;
    sendDownload(pendingSave.url, pendingSave.filename);
    pendingSave = null;
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!INSTAGRAM_ORIGIN.test(event.origin)) return;
    const data = event.data;
    if (!data || data.source !== 'ig-nvc' || data.type !== 'download') return;
    if (typeof data.url !== 'string' || !isAllowedDownloadUrl(data.url)) return;
    const filename =
      typeof data.filename === 'string' && data.filename.toLowerCase().endsWith('.mp4')
        ? data.filename
        : `seekstrip-${Date.now()}.mp4`;
    pendingSave = { url: data.url, filename };
    chrome.storage.local.get('seekstripConsent', (stored) => {
      if (stored && stored.seekstripConsent) tryFlushSave();
    });
  });

  document.addEventListener(
    'click',
    async (event) => {
      const t = event.target;
      if (!t || !t.closest || !t.closest('.ig-nvc-dl')) return;
      const { seekstripConsent } = await chrome.storage.local.get('seekstripConsent');
      if (!seekstripConsent) {
        showConsent();
        return;
      }
      const granted = await requestSavePermissions();
      if (!granted) return;
      if (pendingSave) tryFlushSave();
      else {
        try {
          window.postMessage({ source: 'ig-nvc', type: 'need-url' }, window.location.origin);
        } catch (_) {}
      }
    },
    true,
  );

  const createDownloadButton = () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ig-nvc-dl';
    btn.title = 'Keep video';
    btn.setAttribute('aria-label', 'Keep video');
    btn.innerHTML = DL_ICON;
    const halt = (event) => {
      if (typeof event.button === 'number' && event.button !== 0) return;
      event.stopPropagation();
      if (event.type !== 'pointerdown' && event.type !== 'mousedown' && event.type !== 'touchstart') {
        event.preventDefault();
      }
    };
    ['pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup', 'touchstart'].forEach((type) => {
      btn.addEventListener(type, halt, true);
    });
    return btn;
  };

  const layoutDownloadButton = (el, btn, visible) => {
    if (!btn) return;
    const box = visible ? visibleMediaBox(el) : null;
    if (!box) {
      btn.style.display = 'none';
      return;
    }
    const topOff = isStoriesPath() ? 64 : isReelsPath() ? 16 : 46;
    const left = box.right - 42;
    const top = box.top + topOff;
    const cx = left + 14;
    const cy = top + 14;
    if (cx < box.left || cx > box.right || cy < box.top || cy > box.bottom - 24) {
      btn.style.display = 'none';
      return;
    }
    btn.style.display = 'flex';
    btn.style.left = `${Math.round(left)}px`;
    btn.style.top = `${Math.round(top)}px`;
  };

  const layoutPlayerBar = (video, bar, visible) => {
    if (!bar) return;
    const box = visible ? visibleMediaBox(video) : null;
    if (!box) {
      bar.style.display = 'none';
      return;
    }
    const reels = isReelsPath();
    const barH = reels ? 18 : 14;
    bar.classList.toggle('ig-nvc-reels', reels);
    bar.style.display = 'block';
    bar.style.visibility = 'visible';
    bar.style.left = `${Math.round(box.left)}px`;
    bar.style.width = `${Math.round(box.width)}px`;
    bar.style.top = `${Math.round(box.bottom - barH)}px`;
    bar.style.height = `${barH}px`;
  };

  const installScrubber = (video) => {
    const existing = scrubbers.get(video);
    if (existing) return;
    const parent = video.parentElement;
    if (!parent) return;

    if (!video.dataset.igNvcId) video.dataset.igNvcId = `nvc${(nvcId += 1)}`;

    const bar = document.createElement('div');
    bar.className = 'ig-nvc-bar';
    bar.dataset.igNvcFor = video.dataset.igNvcId;
    const track = document.createElement('div');
    track.className = 'ig-nvc-track';
    const fill = document.createElement('div');
    fill.className = 'ig-nvc-fill';
    const thumb = document.createElement('div');
    thumb.className = 'ig-nvc-thumb';
    track.appendChild(fill);
    track.appendChild(thumb);
    bar.appendChild(track);
    (document.body || document.documentElement).appendChild(bar);
    layoutPlayerBar(video, bar, true);
    const dlBtn = createDownloadButton();
    dlBtn.dataset.igNvcFor = video.dataset.igNvcId;
    (document.body || document.documentElement).appendChild(dlBtn);
    layoutDownloadButton(video, dlBtn, true);

    let dragging = false;
    let raf = 0;

    const setProgress = (pct) => {
      const p = Math.max(0, Math.min(1, pct));
      fill.style.transform = `scaleX(${p})`;
      thumb.style.left = `${p * 100}%`;
    };

    const updateFill = () => {
      if (dragging) return;
      if (!isFinite(video.duration) || video.duration <= 0) return;
      setProgress(video.currentTime / video.duration);
    };

    const tick = () => {
      raf = 0;
      updateFill();
      if (!video.isConnected) return;
      if (dragging || (!video.paused && !video.ended)) {
        raf = requestAnimationFrame(tick);
      }
    };

    const ensureTick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const seekFromEvent = (event) => {
      const rect = track.getBoundingClientRect();
      if (rect.width === 0 || !isFinite(video.duration) || video.duration <= 0) return;
      const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      video.currentTime = pct * video.duration;
      setProgress(pct);
    };

    const onDown = (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      dragging = true;
      bar.classList.add('ig-nvc-drag');
      try {
        bar.setPointerCapture(event.pointerId);
      } catch (_) {}
      seekFromEvent(event);
    };
    const onMove = (event) => {
      if (!dragging) return;
      event.preventDefault();
      event.stopPropagation();
      seekFromEvent(event);
    };
    const onUp = (event) => {
      if (!dragging) return;
      event.preventDefault();
      event.stopPropagation();
      dragging = false;
      bar.classList.remove('ig-nvc-drag');
      try {
        bar.releasePointerCapture(event.pointerId);
      } catch (_) {}
      updateFill();
      if (!video.paused && !video.ended) ensureTick();
    };

    bar.addEventListener('pointerdown', onDown);
    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerup', onUp);
    bar.addEventListener('pointercancel', onUp);
    bar.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    video.addEventListener('play', ensureTick);
    video.addEventListener('playing', ensureTick);
    video.addEventListener('seeked', updateFill);
    video.addEventListener('loadedmetadata', updateFill);
    video.addEventListener('pause', updateFill);
    video.addEventListener('ended', updateFill);
    updateFill();
    if (!video.paused && !video.ended) ensureTick();

    scrubbers.set(video, {
      bar,
      dlBtn,
      cleanup: () => {
        if (raf) cancelAnimationFrame(raf);
        video.removeEventListener('play', ensureTick);
        video.removeEventListener('playing', ensureTick);
        video.removeEventListener('seeked', updateFill);
        video.removeEventListener('loadedmetadata', updateFill);
        video.removeEventListener('pause', updateFill);
        video.removeEventListener('ended', updateFill);
        bar.remove();
        dlBtn.remove();
      },
    });
  };

  const teardownStoryBar = () => {
    if (!storyUi) return;
    storyUi.stop();
    window.removeEventListener('resize', storyUi.layout);
    document.removeEventListener('scroll', storyUi.layout, true);
    storyUi.bar.remove();
    if (storyUi.dlBtn) storyUi.dlBtn.remove();
    storyUi = null;
  };

  const createStoryBar = () => {
    const bar = document.createElement('div');
    bar.className = 'ig-nvc-bar ig-nvc-story';
    const track = document.createElement('div');
    track.className = 'ig-nvc-track';
    const fill = document.createElement('div');
    fill.className = 'ig-nvc-fill';
    const thumb = document.createElement('div');
    thumb.className = 'ig-nvc-thumb';
    track.appendChild(fill);
    track.appendChild(thumb);
    bar.appendChild(track);
    (document.body || document.documentElement).appendChild(bar);

    let dragging = false;
    let media = null;
    let video = null;
    let lastBox = '';
    let raf = 0;
    let stopped = false;

    const dlBtn = createDownloadButton();
    dlBtn.classList.add('ig-nvc-story-dl');
    (document.body || document.documentElement).appendChild(dlBtn);

    let lastPath = location.pathname;

    const setProgress = (pct) => {
      const p = Math.max(0, Math.min(1, pct));
      fill.style.transform = `scaleX(${p})`;
      thumb.style.left = `${p * 100}%`;
    };

    const updateFill = () => {
      if (dragging) return;
      if (!(video instanceof HTMLVideoElement)) return;
      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) return;
      setProgress(video.currentTime / duration);
    };

    const layout = () => {
      const el = media;
      if (!el || !el.isConnected) {
        bar.style.display = 'none';
        dlBtn.style.display = 'none';
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        bar.style.display = 'none';
        dlBtn.style.display = 'none';
        return;
      }
      const isVideo = video instanceof HTMLVideoElement;
      const box = `${rect.left | 0},${rect.top | 0},${rect.width | 0},${isVideo ? 1 : 0}`;
      if (box === lastBox) return;
      lastBox = box;
      bar.style.display = 'block';
      bar.style.left = `${rect.left}px`;
      bar.style.width = `${rect.width}px`;
      bar.style.top = `${rect.top}px`;
      if (isVideo) {
        layoutDownloadButton(el, dlBtn, true);
      } else {
        layoutDownloadButton(el, dlBtn, false);
      }
    };

    const bindMedia = (next) => {
      if (!next || next === media) {
        layout();
        return;
      }
      media = next;
      video = next instanceof HTMLVideoElement ? next : null;
      bar.dataset.igNvcFor = tagMedia(next);
      if (video) dlBtn.dataset.igNvcFor = video.dataset.igNvcId;
      else delete dlBtn.dataset.igNvcFor;
      bar.classList.remove('ig-nvc-hover', 'ig-nvc-drag');
      lastBox = '';
      if (video && isFinite(video.duration) && video.duration > 0) {
        setProgress(video.currentTime / video.duration);
      } else {
        setProgress(0);
      }
      layout();
    };

    const tick = () => {
      if (stopped) return;
      const pathChanged = location.pathname !== lastPath;
      if (pathChanged) lastPath = location.pathname;
      if (pathChanged || !isCenteredStory(media)) {
        const next = findStoryMedia();
        if (next) bindMedia(next);
      }
      layout();
      updateFill();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const seekFromEvent = (event) => {
      if (!(video instanceof HTMLVideoElement) || !isFinite(video.duration) || video.duration <= 0) return;
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) return;
      const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      video.currentTime = pct * video.duration;
      setProgress(pct);
    };

    bar.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      dragging = true;
      bar.classList.add('ig-nvc-drag');
      try {
        bar.setPointerCapture(event.pointerId);
      } catch (_) {}
      seekFromEvent(event);
    });
    bar.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      event.preventDefault();
      event.stopPropagation();
      seekFromEvent(event);
    });
    const onUp = (event) => {
      if (!dragging) return;
      event.preventDefault();
      event.stopPropagation();
      dragging = false;
      bar.classList.remove('ig-nvc-drag');
      try {
        bar.releasePointerCapture(event.pointerId);
      } catch (_) {}
    };
    bar.addEventListener('pointerup', onUp);
    bar.addEventListener('pointercancel', onUp);
    bar.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    window.addEventListener('resize', layout);
    document.addEventListener('scroll', layout, true);

    return {
      bar,
      dlBtn,
      layout,
      bindMedia,
      stop() {
        stopped = true;
        cancelAnimationFrame(raf);
      },
      get media() { return media; },
      get video() { return video; },
    };
  };

  const hideFeedChrome = () => {
    document.documentElement.classList.add('ig-nvc-stories');
    for (const [, entry] of scrubbers) {
      if (entry.bar) entry.bar.style.display = 'none';
      if (entry.dlBtn) entry.dlBtn.style.display = 'none';
    }
  };

  const syncStoryBar = () => {
    if (!isStoriesPath()) {
      document.documentElement.classList.remove('ig-nvc-stories');
      teardownStoryBar();
      return;
    }
    hideFeedChrome();
    const media = findStoryMedia();
    if (!media) {
      if (storyUi) {
        storyUi.bar.style.display = 'none';
        if (storyUi.dlBtn) storyUi.dlBtn.style.display = 'none';
      }
      return;
    }
    if (!storyUi) storyUi = createStoryBar();
    storyUi.bindMedia(media);
  };

  const enable = (video) => {
    if (!isInScope(video)) return;
    video.controls = false;
    video.dataset[MARK] = '1';
    installScrubber(video);
  };

  const runFeedScan = () => {
    if (isStoriesPath()) {
      hideFeedChrome();
      return;
    }
    document.documentElement.classList.remove('ig-nvc-stories');
    teardownStoryBar();
    document.querySelectorAll('video').forEach(enable);
    for (const [video, entry] of scrubbers) {
      if (!video.isConnected) {
        entry.cleanup();
        scrubbers.delete(video);
        continue;
      }
      const show = isPrimaryVisibleVideo(video);
      layoutPlayerBar(video, entry.bar, show);
      layoutDownloadButton(video, entry.dlBtn, show);
    }
  };

  let feedScanScheduled = false;
  const scanFeed = () => {
    if (feedScanScheduled) return;
    feedScanScheduled = true;
    requestAnimationFrame(() => {
      feedScanScheduled = false;
      runFeedScan();
    });
  };

  let storySyncTimer = 0;
  const scheduleStorySync = () => {
    if (storySyncTimer) return;
    storySyncTimer = window.setTimeout(() => {
      storySyncTimer = 0;
      syncStoryBar();
    }, 160);
  };

  injectStyles();
  runFeedScan();
  syncStoryBar();

  let lastPath = location.pathname;
  const applyRoute = () => {
    const path = location.pathname || '';
    if (path === lastPath) {
      if (isStoriesPath()) hideFeedChrome();
      return;
    }
    lastPath = path;
    if (isStoriesPath()) {
      hideFeedChrome();
      scheduleStorySync();
    } else {
      document.documentElement.classList.remove('ig-nvc-stories');
      teardownStoryBar();
      scanFeed();
    }
  };

  const root = document.body || document.documentElement;
  new MutationObserver(() => {
    applyRoute();
    if (isStoriesPath()) scheduleStorySync();
    else scanFeed();
  }).observe(root, {
    childList: true,
    subtree: true,
  });
  window.addEventListener('popstate', applyRoute);

  document.addEventListener(
    'scroll',
    () => {
      if (isStoriesPath()) storyUi && storyUi.layout();
      else scanFeed();
    },
    { capture: true, passive: true },
  );
  window.addEventListener(
    'resize',
    () => {
      if (isStoriesPath()) storyUi && storyUi.layout();
      else scanFeed();
    },
    { passive: true },
  );
})();
