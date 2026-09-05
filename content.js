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
        z-index: 2147483640;
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
      .ig-nvc-k {
        position: fixed;
        top: 0;
        left: 0;
        right: auto;
        z-index: 2147483647;
        width: 36px;
        height: 36px;
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
      .ig-nvc-k:hover {
        background: rgba(0, 0, 0, 0.62);
      }
      .ig-nvc-k svg {
        display: block;
        width: 18px;
        height: 18px;
      }
      html.ig-nvc-stories .ig-nvc-bar:not(.ig-nvc-story),
      html.ig-nvc-stories .ig-nvc-k:not(.ig-nvc-story-k),
      html.ig-nvc-stories .ig-nvc-fs-btn:not(.ig-nvc-story-fs) {
        display: none !important;
      }
      .ig-nvc-fs-btn {
        position: fixed;
        top: 0;
        left: 0;
        right: auto;
        z-index: 2147483647;
        width: 40px;
        height: 40px;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: #f5f5f5;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        -webkit-tap-highlight-color: transparent;
        filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.55));
      }
      .ig-nvc-fs-btn.ig-nvc-fs-feed {
        color: #262626;
        filter: none;
      }
      .ig-nvc-fs-btn svg {
        display: block;
        width: 24px;
        height: 24px;
      }
      .ig-nvc-fs-play {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 2147483647;
        width: 52px;
        height: 52px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.45);
        color: #fff;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        -webkit-tap-highlight-color: transparent;
      }
      .ig-nvc-fs-play:hover,
      .ig-nvc-fs-exit:hover {
        background: rgba(0, 0, 0, 0.62);
      }
      .ig-nvc-fs-play svg,
      .ig-nvc-fs-exit svg {
        display: block;
        width: 26px;
        height: 26px;
      }
      .ig-nvc-fs-exit {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 2147483647;
        width: 52px;
        height: 52px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.45);
        color: #fff;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        -webkit-tap-highlight-color: transparent;
      }
      .ig-nvc-fs-hit {
        position: fixed;
        inset: 0;
        z-index: 2147483645;
        display: none;
        pointer-events: auto;
        background: transparent;
      }
      html.ig-nvc-fs,
      html.ig-nvc-fs body {
        background: #000 !important;
      }
      html.ig-nvc-fs .ig-nvc-fs-pass {
        transform: none !important;
        filter: none !important;
        perspective: none !important;
        clip: auto !important;
        clip-path: none !important;
        overflow: visible !important;
        contain: none !important;
        will-change: auto !important;
      }
      html.ig-nvc-fs body * {
        visibility: hidden !important;
        pointer-events: none !important;
      }
      html.ig-nvc-fs video.ig-nvc-fs-target,
      html.ig-nvc-fs img.ig-nvc-fs-target {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        max-width: none !important;
        max-height: none !important;
        min-width: 0 !important;
        min-height: 0 !important;
        object-fit: contain !important;
        z-index: 2147483646 !important;
        background: #000 !important;
        visibility: visible !important;
        pointer-events: none !important;
      }
      html.ig-nvc-fs .ig-nvc-bar:not(.ig-nvc-bar-fs-active) {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      html.ig-nvc-fs .ig-nvc-bar.ig-nvc-bar-fs-active,
      html.ig-nvc-fs .ig-nvc-bar.ig-nvc-bar-fs-active *,
      html.ig-nvc-fs .ig-nvc-fs-play,
      html.ig-nvc-fs .ig-nvc-fs-play *,
      html.ig-nvc-fs .ig-nvc-fs-exit,
      html.ig-nvc-fs .ig-nvc-fs-exit *,
      html.ig-nvc-fs .ig-nvc-fs-hit,
      html.ig-nvc-fs .ig-nvc-preview,
      html.ig-nvc-fs .ig-nvc-preview * {
        display: block !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }
      html.ig-nvc-fs .ig-nvc-preview {
        display: flex !important;
        pointer-events: none !important;
      }
      html.ig-nvc-fs .ig-nvc-k,
      html.ig-nvc-fs .ig-nvc-fs-btn {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      .ig-nvc-preview {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 2147483647 !important;
        display: none;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
        transform: translate(-50%, -100%);
        transition: opacity 0.1s ease;
        opacity: 0;
      }
      .ig-nvc-preview.ig-nvc-preview-visible {
        display: flex;
        opacity: 1;
      }
      .ig-nvc-preview-card {
        width: 106px;
        height: 160px;
        background: #000;
        border-radius: 10px;
        overflow: hidden;
        border: 2px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 8px 26px rgba(0, 0, 0, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .ig-nvc-preview-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        pointer-events: none;
      }
      .ig-nvc-preview-video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        background: transparent;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.12s ease;
      }
      .ig-nvc-preview-video.ig-nvc-video-ready {
        opacity: 1;
      }
      .ig-nvc-preview-time {
        margin-top: 6px;
        font: 700 13px/1 system-ui, -apple-system, sans-serif;
        color: #ffffff;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95), 0 0 2px rgba(0, 0, 0, 0.95);
        letter-spacing: 0.5px;
        background: rgba(0, 0, 0, 0.65);
        padding: 4px 8px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      }
      .ig-nvc-preview.ig-nvc-story-preview .ig-nvc-preview-card {
        display: none !important;
      }
      .ig-nvc-preview.ig-nvc-story-preview .ig-nvc-preview-time {
        margin-top: 0;
        padding: 2px 6px;
        font: 700 11px/1.2 system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #ffffff;
        background: rgba(18, 18, 18, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
        letter-spacing: 0.3px;
        white-space: nowrap;
        pointer-events: none;
      }
      html.ig-nvc-fs .ig-nvc-fs-hit {
        display: block !important;
      }
      html.ig-nvc-fs .ig-nvc-fs-play,
      html.ig-nvc-fs .ig-nvc-fs-exit {
        display: flex !important;
      }
      .ig-nvc-k.ig-nvc-k-busy {
        opacity: 0.5;
        pointer-events: none;
      }
      .ig-nvc-toast {
        position: fixed;
        left: 50%;
        bottom: 24px;
        transform: translateX(-50%);
        z-index: 2147483647;
        max-width: min(440px, calc(100vw - 24px));
        padding: 10px 14px;
        border-radius: 10px;
        background: #101826;
        color: #e8eef7;
        font: 600 13px/1.35 system-ui, sans-serif;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
        pointer-events: none;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  };

  const visibleMediaBox = (el) => {
    if (!el || !el.isConnected) return null;
    if (
      document.documentElement.classList.contains('ig-nvc-fs') &&
      el.classList.contains('ig-nvc-fs-target')
    ) {
      return {
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
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

  const getActiveDialog = () => {
    const dialogs = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
    for (let i = 0; i < dialogs.length; i += 1) {
      const d = dialogs[i];
      if (!(d instanceof HTMLElement) || !d.isConnected) continue;
      const style = window.getComputedStyle(d);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
      const rect = d.getBoundingClientRect();
      if (rect.width >= 200 && rect.height >= 200 && rect.bottom > 0 && rect.top < window.innerHeight) {
        return d;
      }
    }
    return null;
  };

  const isElementOccluded = (el, box) => {
    if (!el || !box) return true;
    const cx = Math.round(box.left + box.width / 2);
    const cy = Math.round(box.top + box.height / 2);
    if (cx < 0 || cx > window.innerWidth || cy < 0 || cy > window.innerHeight) return true;
    const hit = document.elementFromPoint(cx, cy);
    if (!hit) return false;
    if (hit.closest && hit.closest(OUR_UI)) return false;
    if (el.contains(hit) || hit.contains(el)) return false;
    const elRoot = playerRoot(el);
    if (elRoot && elRoot.contains(hit)) return false;
    return true;
  };

  const findBestVisibleVideo = () => {
    if (document.documentElement.classList.contains('ig-nvc-fs')) {
      if (fsState.media instanceof HTMLVideoElement && fsState.media.isConnected) {
        return fsState.media;
      }
      return null;
    }

    if (isReelsPath()) {
      const activeDialog = getActiveDialog();
      if (activeDialog) {
        const dialogVideo = activeDialog.querySelector('video');
        if (dialogVideo && isInScope(dialogVideo)) return dialogVideo;
      }
      let best = null;
      let bestScore = -Infinity;
      document.querySelectorAll('video').forEach((el) => {
        if (!(el instanceof HTMLVideoElement) || !el.isConnected) return;
        const box = visibleMediaBox(el);
        if (!box) return;
        let score = box.width * box.height;
        if (!el.paused && el.readyState >= 2) score += 1e9;
        const dx = box.left + box.width / 2 - window.innerWidth / 2;
        const dy = box.top + box.height / 2 - window.innerHeight / 2;
        score -= (Math.abs(dx) + Math.abs(dy)) * 10;
        if (score > bestScore) {
          bestScore = score;
          best = el;
        }
      });
      return best;
    }

    const activeDialog = getActiveDialog();
    const dialogVideo = activeDialog ? activeDialog.querySelector('video') : null;

    let best = null;
    let bestScore = -Infinity;

    document.querySelectorAll('video').forEach((el) => {
      if (!(el instanceof HTMLVideoElement) || !el.isConnected) return;
      if (!isInScope(el)) return;

      if (dialogVideo && (!activeDialog || !activeDialog.contains(el))) return;

      if (primaryVideoInRoot(el) !== el) return;

      const box = visibleMediaBox(el);
      if (!box) return;

      if (isElementOccluded(el, box)) return;

      let score = box.width * box.height;
      if (!el.paused && el.readyState >= 2) score += 1e9;

      if (activeDialog && activeDialog.contains(el)) score += 1e8;

      const dx = box.left + box.width / 2 - window.innerWidth / 2;
      const dy = box.top + box.height / 2 - window.innerHeight / 2;
      score -= (Math.abs(dx) + Math.abs(dy)) * 10;

      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    });

    return best;
  };

  const isPrimaryVisibleVideo = (video) => {
    return findBestVisibleVideo() === video;
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
  const FS_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H3v5"/><path d="M21 8V3h-5"/><path d="M3 16v5h5"/><path d="M16 21h5v-5"/></svg>';
  const PLAY_ICON =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const PAUSE_ICON =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  const EXIT_FS_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v5H3"/><path d="M16 3v5h5"/><path d="M8 21v-5H3"/><path d="M16 21v-5h5"/></svg>';
  const OUR_UI = '.ig-nvc-bar, .ig-nvc-k, .ig-nvc-fs-btn, .ig-nvc-fs-play, .ig-nvc-fs-exit, .ig-nvc-fs-hit';
  const FS_BTN_SIZE = 40;
  const FS_PLAY_SIZE = 52;
  const STORY_PAUSE_RE = /^(pause|play|duraklat|oynat|pausa|reproducir|anhalten|abspielen)\b/i;

  const haltUiEvent = (event) => {
    if (typeof event.button === 'number' && event.button !== 0) return;
    event.stopPropagation();
    if (
      event.type === 'click' &&
      event.target &&
      event.target.closest &&
      event.target.closest('.ig-nvc-k')
    ) {
      return;
    }
    if (event.type !== 'pointerdown' && event.type !== 'mousedown' && event.type !== 'touchstart') {
      event.preventDefault();
    }
  };

  const bindHalt = (el) => {
    ['pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup', 'touchstart'].forEach((type) => {
      el.addEventListener(type, haltUiEvent, true);
    });
  };

  const isOurSvg = (svg) => !!(svg && svg.closest && svg.closest(OUR_UI));

  const svgBox = (svg) => {
    const r = svg.getBoundingClientRect();
    if (r.width < 18 || r.width > 56 || r.height < 18 || r.height > 56) return null;
    if (r.bottom < 0 || r.top > window.innerHeight) return null;
    return r;
  };

  const SAVE_LABEL_RE = /^(save|saved|kaydet|kaydedildi|guardar|guardado|speichern|enregistrer|salva)\b/i;
  const LIKE_LABEL_RE = /^(like|unlike|liked|beğen|beğenmekten|remove like|ya me gusta)\b/i;

  const ariaLabelOf = (svg) => {
    const host = (svg.closest && svg.closest('[aria-label]')) || svg;
    return ((host && host.getAttribute('aria-label')) || (svg.getAttribute && svg.getAttribute('aria-label')) || '').trim();
  };

  const findFeedSaveControl = (video) => {
    const box = visibleMediaBox(video);
    if (!box) return null;
    const root = playerRoot(video) || document;
    const row = [];
    root.querySelectorAll('svg').forEach((svg) => {
      if (isOurSvg(svg)) return;
      const r = svgBox(svg);
      if (!r) return;
      if (r.top <= box.bottom - 12 || r.top >= box.bottom + 72) return;
      if (r.right < box.left - 8 || r.left > box.right + 8) return;
      row.push({ svg, r });
    });
    if (!row.length) return null;
    const labeled = row.find((item) => SAVE_LABEL_RE.test(ariaLabelOf(item.svg)));
    if (labeled) return labeled;
    row.sort((a, b) => b.r.left - a.r.left);
    return row[0];
  };

  const findReelsLikeControl = (video) => {
    const box = visibleMediaBox(video);
    if (!box) return null;
    const items = [];
    document.querySelectorAll('svg').forEach((svg) => {
      if (isOurSvg(svg)) return;
      const r = svgBox(svg);
      if (!r) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (cy < box.top + 40 || cy > box.bottom - 40) return;
      if (cx < box.right - 80 || cx > box.right + 90) return;
      items.push({ svg, r, cx });
    });
    if (!items.length) return null;
    const labeled = items.find((item) => LIKE_LABEL_RE.test(ariaLabelOf(item.svg)));
    if (labeled) return labeled;
    items.sort((a, b) => a.r.top - b.r.top);
    return items[0];
  };

  const findNativeStoryToggle = () => {
    const nodes = document.querySelectorAll('[aria-label]');
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (node.closest && node.closest(OUR_UI)) continue;
      const label = (node.getAttribute('aria-label') || '').trim();
      if (!STORY_PAUSE_RE.test(label)) continue;
      return node.closest('button, [role="button"]') || node;
    }
    return null;
  };

  let fsState = { media: null, pass: [] };
  let fsPlayBtn = null;
  let fsExitBtn = null;
  let fsHit = null;
  let pendingFsMedia = null;

  const isFsActive = () =>
    !!(document.fullscreenElement || document.webkitFullscreenElement);

  const setUserPaused = (paused) => {
    const html = document.documentElement;
    if (paused) html.dataset.igNvcUserPaused = '1';
    else delete html.dataset.igNvcUserPaused;
  };

  const clearFsPass = () => {
    document.querySelectorAll('.ig-nvc-fs-pass').forEach((node) => {
      node.classList.remove('ig-nvc-fs-pass');
    });
    fsState.pass = [];
  };

  const markFsPass = (el) => {
    clearFsPass();
    const nodes = [];
    let node = el && el.parentElement;
    while (node && node !== document.documentElement) {
      node.classList.add('ig-nvc-fs-pass');
      nodes.push(node);
      node = node.parentElement;
    }
    fsState.pass = nodes;
  };

  const fsVideo = () =>
    fsState.media instanceof HTMLVideoElement ? fsState.media : null;

  const syncPlayPauseIcon = () => {
    if (!fsPlayBtn) return;
    const video = fsVideo();
    const paused = !video || video.paused || video.ended;
    fsPlayBtn.innerHTML = paused ? PLAY_ICON : PAUSE_ICON;
    fsPlayBtn.title = paused ? 'Play' : 'Pause';
    fsPlayBtn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
  };

  const layoutFsControls = () => {
    if (!fsPlayBtn) return;
    if (!document.documentElement.classList.contains('ig-nvc-fs')) {
      fsPlayBtn.style.display = 'none';
      if (fsExitBtn) fsExitBtn.style.display = 'none';
      if (fsHit) fsHit.style.display = 'none';
      return;
    }
    const barH = isStoriesPath() ? 32 : isReelsPath() ? 18 : 14;
    const gap = 12;
    const total = FS_PLAY_SIZE * 2 + gap;
    const left0 = Math.round(window.innerWidth / 2 - total / 2);
    const top = Math.round(window.innerHeight - barH - 16 - FS_PLAY_SIZE);
    fsPlayBtn.style.display = 'flex';
    fsPlayBtn.style.left = `${left0}px`;
    fsPlayBtn.style.top = `${top}px`;
    if (fsExitBtn) {
      fsExitBtn.style.display = 'flex';
      fsExitBtn.style.left = `${left0 + FS_PLAY_SIZE + gap}px`;
      fsExitBtn.style.top = `${top}px`;
    }
    if (fsHit) fsHit.style.display = 'block';
    syncPlayPauseIcon();
  };

  const clickNativeStoryToggle = () => {
    const el = findNativeStoryToggle();
    if (!el) return false;
    try {
      el.click();
      return true;
    } catch (_) {
      return false;
    }
  };

  const togglePlayback = () => {
    const video = fsVideo();
    if (isStoriesPath()) {
      if (video && !video.paused) setUserPaused(true);
      else setUserPaused(false);
      const clicked = clickNativeStoryToggle();
      if (!clicked && video) {
        if (video.paused) {
          setUserPaused(false);
          video.play().catch(() => {});
        } else {
          setUserPaused(true);
          video.pause();
        }
      }
      window.setTimeout(syncPlayPauseIcon, 50);
      return;
    }
    if (!video) return;
    if (video.paused) {
      setUserPaused(false);
      video.play().catch(() => {});
    } else {
      setUserPaused(true);
      video.pause();
    }
    syncPlayPauseIcon();
  };

  const markActiveFsBar = (media) => {
    document.querySelectorAll('.ig-nvc-bar-fs-active').forEach((b) => b.classList.remove('ig-nvc-bar-fs-active'));
    if (!media) return;
    const entry = scrubbers.get(media);
    if (entry && entry.bar) {
      entry.bar.classList.add('ig-nvc-bar-fs-active');
    }
  };

  const relayoutFs = () => {
    if (isStoriesPath()) {
      if (storyUi) storyUi.layout(true);
    } else {
      markActiveFsBar(fsState.media);
      for (const [video, entry] of scrubbers) {
        if (!video.isConnected) continue;
        const show = video === fsState.media;
        layoutPlayerBar(video, entry.bar, show);
        if (entry.dlBtn) {
          entry.dlBtn.style.display = 'none';
          entry.dlBtn.style.visibility = 'hidden';
        }
        if (entry.fsBtn) {
          entry.fsBtn.style.display = 'none';
          entry.fsBtn.style.visibility = 'hidden';
        }
      }
    }
    layoutFsControls();
  };

  const pickFallbackFsMedia = () => {
    if (isStoriesPath() && storyUi && storyUi.media && storyUi.media.isConnected) return storyUi.media;
    let best = null;
    let bestScore = -1;
    document.querySelectorAll('video').forEach((el) => {
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

  const retargetFsMedia = () => {
    if (!document.documentElement.classList.contains('ig-nvc-fs')) return;
    if (fsState.media && fsState.media.isConnected) return;
    const next = pickFallbackFsMedia();
    if (!next) return;
    if (fsState.media) fsState.media.classList.remove('ig-nvc-fs-target');
    fsState.media = next;
    next.classList.add('ig-nvc-fs-target');
    markFsPass(next);
  };

  const cleanupFsChrome = () => {
    const html = document.documentElement;
    html.classList.remove('ig-nvc-fs');
    delete html.dataset.igNvcFs;
    delete html.dataset.igNvcUserPaused;
    if (fsState.media) fsState.media.classList.remove('ig-nvc-fs-target');
    document.querySelectorAll('.ig-nvc-bar-fs-active').forEach((b) => b.classList.remove('ig-nvc-bar-fs-active'));
    clearFsPass();
    fsState.media = null;
    if (fsPlayBtn) fsPlayBtn.style.display = 'none';
    if (fsExitBtn) fsExitBtn.style.display = 'none';
    if (fsHit) fsHit.style.display = 'none';
  };

  const applyCinema = (media) => {
    if (!media) return;
    if (fsState.media && fsState.media !== media) fsState.media.classList.remove('ig-nvc-fs-target');
    fsState.media = media;
    media.classList.add('ig-nvc-fs-target');
    document.documentElement.classList.add('ig-nvc-fs');
    document.documentElement.dataset.igNvcFs = '1';
    setUserPaused(false);
    markFsPass(media);
    ensureFsControls();
    markActiveFsBar(media);
    layoutFsControls();
  };

  const requestPageFullscreen = () => {
    const html = document.documentElement;
    if (isFsActive()) return Promise.resolve();
    const go = (node) => {
      if (!node) return Promise.reject(new Error('no node'));
      try {
        if (typeof node.requestFullscreen === 'function') {
          return node.requestFullscreen({ navigationUI: 'hide' }).catch(() => node.requestFullscreen());
        }
        if (typeof node.webkitRequestFullscreen === 'function') {
          node.webkitRequestFullscreen();
          return Promise.resolve();
        }
      } catch (_) {}
      return Promise.reject(new Error('no api'));
    };
    return go(html).catch(() => go(document.body)).catch(() => {
      try {
        window.postMessage({ source: 'ig-nvc', type: 'request-fs' }, window.location.origin);
      } catch (__) {}
      return Promise.resolve();
    });
  };

  const enterFullscreen = (media) => {
    if (!media) return;
    applyCinema(media);
    requestPageFullscreen();
  };

  const exitFullscreen = () => {
    document.documentElement.dataset.igNvcFsExit = '1';
    cleanupFsChrome();
    try {
      if (document.exitFullscreen && (document.fullscreenElement || document.webkitFullscreenElement)) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
        document.webkitExitFullscreen();
      }
    } catch (_) {}
    delete document.documentElement.dataset.igNvcFsExit;
    if (isStoriesPath()) {
      if (storyUi) storyUi.layout(true);
    } else {
      scanFeed();
    }
  };

  const ensureFsControls = () => {
    if (!fsHit) {
      fsHit = document.createElement('div');
      fsHit.className = 'ig-nvc-fs-hit';
      fsHit.addEventListener('click', (event) => {
        haltUiEvent(event);
        togglePlayback();
      }, true);
      bindHalt(fsHit);
      (document.body || document.documentElement).appendChild(fsHit);
    }
    if (!fsPlayBtn) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ig-nvc-fs-play';
      btn.innerHTML = PAUSE_ICON;
      bindHalt(btn);
      btn.addEventListener('click', (event) => {
        haltUiEvent(event);
        togglePlayback();
      }, true);
      (document.body || document.documentElement).appendChild(btn);
      fsPlayBtn = btn;
    }
    if (!fsExitBtn) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ig-nvc-fs-exit';
      btn.title = 'Exit full screen';
      btn.setAttribute('aria-label', 'Exit full screen');
      btn.innerHTML = EXIT_FS_ICON;
      bindHalt(btn);
      btn.addEventListener('click', (event) => {
        haltUiEvent(event);
        exitFullscreen();
      }, true);
      (document.body || document.documentElement).appendChild(btn);
      fsExitBtn = btn;
    }
    return fsPlayBtn;
  };

  const createFullscreenButton = (kind) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ig-nvc-fs-btn';
    if (kind === 'feed') btn.classList.add('ig-nvc-fs-feed');
    if (kind === 'story') btn.classList.add('ig-nvc-story-fs');
    btn.title = 'Full screen';
    btn.setAttribute('aria-label', 'Full screen');
    btn.innerHTML = FS_ICON;
    bindHalt(btn);
    btn.addEventListener(
      'pointerdown',
      (event) => {
        if (typeof event.button === 'number' && event.button !== 0) return;
        const media = resolveFsMedia(btn);
        if (media) pendingFsMedia = media;
      },
      true,
    );
    btn.addEventListener(
      'click',
      (event) => {
        haltUiEvent(event);
        const media = resolveFsMedia(btn);
        if (media) enterFullscreen(media);
      },
      true,
    );
    return btn;
  };

  const resolveFsMedia = (btn) => {
    const id = btn && btn.dataset && btn.dataset.igNvcFor;
    if (id) {
      const tagged =
        document.querySelector(`video[data-ig-nvc-id="${id}"]`) ||
        document.querySelector(`img[data-ig-nvc-id="${id}"]`);
      if (tagged) return tagged;
    }
    if (isStoriesPath() && storyUi && storyUi.media) return storyUi.media;
    return null;
  };

  const layoutFullscreenButton = (el, btn, visible) => {
    if (!btn) return;
    if (document.documentElement.classList.contains('ig-nvc-fs')) {
      btn.style.display = 'none';
      btn.style.visibility = 'hidden';
      return;
    }
    if (!visible || !el || !el.isConnected) {
      btn.style.display = 'none';
      btn.style.visibility = 'hidden';
      return;
    }
    if (isStoriesPath()) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        btn.style.display = 'none';
        btn.style.visibility = 'hidden';
        return;
      }
      btn.style.display = 'flex';
      btn.style.visibility = 'visible';
      btn.style.left = `${Math.round(Math.min(rect.right + 12, window.innerWidth - FS_BTN_SIZE - 8))}px`;
      btn.style.top = `${Math.round(rect.top + 36)}px`;
      return;
    }
    const box = visibleMediaBox(el);
    if (!box) {
      btn.style.display = 'none';
      btn.style.visibility = 'hidden';
      return;
    }
    if (isReelsPath()) {
      const like = findReelsLikeControl(el);
      btn.style.display = 'flex';
      if (like) {
        btn.style.left = `${Math.round(like.r.left + like.r.width / 2 - FS_BTN_SIZE / 2)}px`;
        btn.style.top = `${Math.round(like.r.top - 8 - FS_BTN_SIZE)}px`;
      } else {
        btn.style.left = `${Math.round(box.right + 12)}px`;
        btn.style.top = `${Math.round(box.top + Math.min(220, box.height * 0.32))}px`;
      }
      return;
    }
    const save = findFeedSaveControl(el);
    btn.style.display = 'flex';
    if (save) {
      btn.style.left = `${Math.round(Math.max(0, save.r.left - 8 - FS_BTN_SIZE))}px`;
      btn.style.top = `${Math.round(save.r.top + save.r.height / 2 - FS_BTN_SIZE / 2)}px`;
    } else {
      btn.style.left = `${Math.round(Math.max(0, box.right - FS_BTN_SIZE * 2 - 8))}px`;
      btn.style.top = `${Math.round(box.bottom + 6)}px`;
    }
  };

  const CDN_HOST = /(^|\.)cdninstagram\.com$/i;
  const FBCDN_HOST = /(^|\.)fbcdn\.net$/i;

  const isAllowedDownloadUrl = (urlStr) => {
    try {
      const url = new URL(urlStr);
      if (url.protocol !== 'https:') return false;
      return CDN_HOST.test(url.hostname) || FBCDN_HOST.test(url.hostname);
    } catch (_) {
      return false;
    }
  };

  let saving = false;
  let toastTimer = 0;

  const showNotice = (text) => {
    let el = document.getElementById('ig-nvc-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ig-nvc-toast';
      el.className = 'ig-nvc-toast';
      (document.body || document.documentElement).appendChild(el);
    }
    el.textContent = text;
    el.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 4200);
  };

  const clickAnchor = (href, filename) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename || 'video.mp4';
    a.rel = 'noopener';
    a.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    (document.body || document.documentElement).appendChild(a);
    a.click();
    a.remove();
  };

  const keepFilename = (filename) =>
    typeof filename === 'string' && filename.toLowerCase().endsWith('.mp4')
      ? filename
      : `video-${Date.now()}.mp4`;

  const sendRuntime = (payload) =>
    new Promise((resolve) => {
      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;
        resolve(value);
      };
      const timer = setTimeout(() => finish(null), 8000);
      try {
        if (!chrome.runtime || !chrome.runtime.sendMessage) {
          clearTimeout(timer);
          finish(null);
          return;
        }
        chrome.runtime.sendMessage(payload, (res) => {
          clearTimeout(timer);
          if (chrome.runtime.lastError) {
            finish(null);
            return;
          }
          finish(res || null);
        });
      } catch (_) {
        clearTimeout(timer);
        finish(null);
      }
    });

  const fetchBlob = async (url) => {
    const opts = {
      credentials: 'omit',
      mode: 'cors',
      referrer: location.href,
    };
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      opts.signal = AbortSignal.timeout(90000);
    }
    let res;
    try {
      res = await fetch(url, Object.assign({}, opts, { cache: 'force-cache' }));
    } catch (_) {
      res = null;
    }
    if (!res || !res.ok) res = await fetch(url, Object.assign({}, opts, { cache: 'no-store' }));
    if (!res.ok) throw new Error('http');
    const blob = await res.blob();
    if (!blob || blob.size < 64) throw new Error('empty');
    return blob;
  };

  const isAdobeCompatEnabled = async () => {
    try {
      if (!chrome.storage || !chrome.storage.local) return false;
      const res = await new Promise((resolve) => {
        chrome.storage.local.get({ adobeCompat: false }, resolve);
      });
      return !!(res && res.adobeCompat);
    } catch (_) {
      return false;
    }
  };

  const saveBlob = async (url, name) => {
    const blob = await fetchBlob(url);
    const isAdobe = await isAdobeCompatEnabled();
    let finalBlob = blob;
    let finalName = name;
    if (isAdobe && window.AdobeTranscoder) {
      try {
        finalBlob = await window.AdobeTranscoder.normalizeForAdobe(blob);
        finalName = name.replace(/\.mp4$/i, '') + '-adobe.mp4';
      } catch (err) {
        console.warn('[IBC] Adobe normalization error in saveBlob:', err);
      }
    }
    const href = URL.createObjectURL(finalBlob);
    clickAnchor(href, finalName);
    setTimeout(() => URL.revokeObjectURL(href), 60000);
  };

  const keepFromUrl = async (url, filename) => {
    const name = keepFilename(filename);
    if (!url || !isAllowedDownloadUrl(url)) {
      showNotice('Video not found');
      return;
    }
    if (saving) return;
    saving = true;
    showNotice('Saving…');
    try {
      const isAdobe = await isAdobeCompatEnabled();
      if (isAdobe && window.AdobeTranscoder) {
        showNotice('Optimizing for Adobe…');
        try {
          const originalBlob = await fetchBlob(url);
          const adobeBlob = await window.AdobeTranscoder.normalizeForAdobe(originalBlob);
          const adobeFilename = name.replace(/\.mp4$/i, '') + '-adobe.mp4';
          const href = URL.createObjectURL(adobeBlob);
          clickAnchor(href, adobeFilename);
          setTimeout(() => URL.revokeObjectURL(href), 60000);
          showNotice('Saved (Adobe Ready)');
          return;
        } catch (transcodeErr) {
          console.warn('[IBC] Adobe transcode failed, falling back to direct save:', transcodeErr);
        }
      }

      const viaExt = await sendRuntime({
        type: 'seekstrip-download',
        url,
        filename: name,
      });
      if (viaExt && viaExt.ok) {
        showNotice('Saved');
        return;
      }
      await saveBlob(url, name);
      showNotice('Saved');
    } catch (_) {
      clickAnchor(url, name);
      showNotice('Could not save. Try again, or lower Shields on Instagram.');
    } finally {
      saving = false;
    }
  };

  try {
    chrome.runtime.onMessage.addListener((msg) => {
      if (!msg || msg.type !== 'seekstrip-download-failed') return;
      if (typeof msg.url !== 'string' || !isAllowedDownloadUrl(msg.url)) return;
      void (async () => {
        const name = keepFilename(msg.filename);
        try {
          await saveBlob(msg.url, name);
          showNotice('Saved');
        } catch (_) {
          clickAnchor(msg.url, name);
          showNotice('Could not save. Try again, or lower Shields on Instagram.');
        }
      })();
    });
  } catch (_) {}

  const askUrlFromPage = (btn) => {
    const detail = {
      url: '',
      filename: '',
      btnId: (btn && btn.dataset && btn.dataset.igNvcFor) || '',
    };
    document.documentElement.dispatchEvent(
      new CustomEvent('ig-nvc-ask-url', { bubbles: true, detail }),
    );
    return detail;
  };

  const formatTime = (secs) => {
    if (!isFinite(secs) || secs < 0) return '0:00';
    const s = Math.floor(secs);
    const m = Math.floor(s / 60);
    const remSec = s % 60;
    const remSecStr = remSec < 10 ? `0${remSec}` : `${remSec}`;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remMin = m % 60;
      const remMinStr = remMin < 10 ? `0${remMin}` : `${remMin}`;
      return `${h}:${remMinStr}:${remSecStr}`;
    }
    return `${m}:${remSecStr}`;
  };

  const resolveVideoUrl = (video) => {
    if (!(video instanceof HTMLVideoElement)) return '';
    if (video.dataset.igNvcDl && isAllowedDownloadUrl(video.dataset.igNvcDl)) {
      return video.dataset.igNvcDl;
    }
    const direct = video.currentSrc || video.src || '';
    if (direct && !direct.startsWith('blob:') && isAllowedDownloadUrl(direct)) {
      return direct;
    }
    const detail = {
      url: '',
      filename: '',
      btnId: video.dataset.igNvcId || '',
    };
    document.documentElement.dispatchEvent(
      new CustomEvent('ig-nvc-ask-url', { bubbles: true, detail }),
    );
    if (detail.url && isAllowedDownloadUrl(detail.url)) {
      video.dataset.igNvcDl = detail.url;
      return detail.url;
    }
    return '';
  };

  let previewUi = null;
  const ensurePreviewUi = () => {
    if (previewUi) return previewUi;
    const container = document.createElement('div');
    container.className = 'ig-nvc-preview';
    const card = document.createElement('div');
    card.className = 'ig-nvc-preview-card';
    const canvas = document.createElement('canvas');
    canvas.className = 'ig-nvc-preview-canvas';
    canvas.width = 106;
    canvas.height = 160;
    const canvasCtx = canvas.getContext('2d');
    const video = document.createElement('video');
    video.className = 'ig-nvc-preview-video';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.tabIndex = -1;
    card.appendChild(canvas);
    card.appendChild(video);
    const timeLabel = document.createElement('div');
    timeLabel.className = 'ig-nvc-preview-time';
    timeLabel.textContent = '0:00';
    container.appendChild(card);
    container.appendChild(timeLabel);
    (document.body || document.documentElement).appendChild(container);

    let isSeeking = false;
    let pendingTime = -1;
    let cleanupTimer = 0;
    let seekFailsafe = 0;

    const doSeek = () => {
      if (pendingTime < 0) return;
      if (video.readyState < 2) return;
      if (isSeeking) return;
      if (Math.abs(video.currentTime - pendingTime) < 0.02) return;
      isSeeking = true;
      if (seekFailsafe) clearTimeout(seekFailsafe);
      seekFailsafe = setTimeout(() => {
        isSeeking = false;
        doSeek();
      }, 70);
      try {
        video.currentTime = pendingTime;
      } catch (_) {
        isSeeking = false;
      }
    };

    video.addEventListener('loadeddata', () => {
      if (previewUi && previewUi.loadedMedia === previewUi.activeMedia) {
        doSeek();
      }
    });

    video.addEventListener('canplay', () => {
      if (previewUi && previewUi.loadedMedia === previewUi.activeMedia) {
        doSeek();
      }
    });

    video.addEventListener('seeked', () => {
      isSeeking = false;
      if (seekFailsafe) clearTimeout(seekFailsafe);
      if (previewUi && previewUi.loadedMedia === previewUi.activeMedia && pendingTime >= 0) {
        video.classList.add('ig-nvc-video-ready');
      }
      if (pendingTime >= 0 && Math.abs(video.currentTime - pendingTime) >= 0.02) {
        doSeek();
      }
    });

    video.addEventListener('error', () => {
      isSeeking = false;
      if (seekFailsafe) clearTimeout(seekFailsafe);
    });

    previewUi = {
      container,
      card,
      canvas,
      video,
      timeLabel,
      activeMedia: null,
      loadedMedia: null,
      loadedUrl: '',

      resetForMedia(nextMedia) {
        this.activeMedia = nextMedia;
        pendingTime = -1;
        isSeeking = false;
        if (seekFailsafe) {
          clearTimeout(seekFailsafe);
          seekFailsafe = 0;
        }
        video.classList.remove('ig-nvc-video-ready');
        if (canvasCtx) {
          canvasCtx.clearRect(0, 0, 106, 160);
          if (nextMedia instanceof HTMLVideoElement && nextMedia.readyState >= 2) {
            try {
              canvasCtx.drawImage(nextMedia, 0, 0, 106, 160);
            } catch (_) {}
          }
        }
        if (this.loadedMedia !== nextMedia) {
          this.loadedMedia = null;
          this.loadedUrl = '';
          if (video.src) {
            video.removeAttribute('src');
            video.load();
          }
        }
      },

      preload(media) {
        if (!(media instanceof HTMLVideoElement)) return;
        if (this.activeMedia !== media) {
          this.resetForMedia(media);
        }
        if (this.loadedMedia === media && video.src) return;

        const url = resolveVideoUrl(media);
        if (url) {
          this.loadedMedia = media;
          this.loadedUrl = url;
          if (video.src !== url) {
            video.classList.remove('ig-nvc-video-ready');
            video.src = url;
            video.load();
          }
        } else {
          this.loadedMedia = null;
          this.loadedUrl = '';
          if (video.src) {
            video.removeAttribute('src');
            video.load();
          }
        }
      },

      show(clientX, trackRect, media, pct, isStory = false) {
        if (cleanupTimer) {
          clearTimeout(cleanupTimer);
          cleanupTimer = 0;
        }
        if (!media || !isFinite(media.duration) || media.duration <= 0) {
          this.hide();
          return;
        }
        const targetTime = Math.max(0, Math.min(media.duration, pct * media.duration));
        this.timeLabel.textContent = formatTime(targetTime);

        const storyMode = !!isStory || isStoriesPath();
        this.container.classList.toggle('ig-nvc-story-preview', storyMode);

        const cardW = storyMode ? 44 : 106;
        const halfW = cardW / 2;
        const clampedX = Math.round(Math.max(halfW + 8, Math.min(window.innerWidth - halfW - 8, clientX)));

        let topY;
        if (storyMode) {
          if (trackRect.top >= 28) {
            topY = Math.round(trackRect.top - 8);
            this.container.style.transform = 'translate(-50%, -100%)';
          } else if (trackRect.top >= 20) {
            topY = Math.round(trackRect.top - 3);
            this.container.style.transform = 'translate(-50%, -100%)';
          } else {
            topY = Math.round(trackRect.top + 36);
            this.container.style.transform = 'translate(-50%, 0)';
          }
        } else {
          topY = Math.round(trackRect.top - 8);
          this.container.style.transform = 'translate(-50%, -100%)';
        }

        this.container.style.left = `${clampedX}px`;
        this.container.style.top = `${topY}px`;
        this.container.classList.add('ig-nvc-preview-visible');

        if (storyMode) {
          this.card.style.display = 'none';
          return;
        }

        this.card.style.display = 'flex';

        if (media instanceof HTMLVideoElement) {
          if (this.activeMedia !== media) {
            this.resetForMedia(media);
          }

          if (!video.classList.contains('ig-nvc-video-ready') && media.readyState >= 2 && canvasCtx) {
            try {
              canvasCtx.drawImage(media, 0, 0, 106, 160);
            } catch (_) {}
          }

          if (this.loadedMedia !== media || !video.src) {
            this.preload(media);
          }

          pendingTime = targetTime;
          doSeek();
        }
      },

      hide() {
        pendingTime = -1;
        isSeeking = false;
        if (seekFailsafe) clearTimeout(seekFailsafe);
        this.container.classList.remove('ig-nvc-preview-visible', 'ig-nvc-story-preview');
        this.container.style.transform = 'translate(-50%, -100%)';
        if (cleanupTimer) clearTimeout(cleanupTimer);
        cleanupTimer = setTimeout(() => {
          cleanupTimer = 0;
          if (!container.classList.contains('ig-nvc-preview-visible')) {
            this.activeMedia = null;
            this.loadedMedia = null;
            this.loadedUrl = '';
            video.classList.remove('ig-nvc-video-ready');
            if (canvasCtx) canvasCtx.clearRect(0, 0, 106, 160);
            if (video.src) {
              video.removeAttribute('src');
              video.load();
            }
          }
        }, 4000);
      },
    };
    return previewUi;
  };

  document.addEventListener(
    'ig-nvc-keep',
    (event) => {
      const d = event.detail || {};
      void keepFromUrl(d.url, d.filename);
    },
    true,
  );

  const createDownloadButton = () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ig-nvc-k';
    btn.title = 'Keep video';
    btn.setAttribute('aria-label', 'Keep video');
    btn.innerHTML = DL_ICON;
    bindHalt(btn);
    btn.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        const detail = askUrlFromPage(btn);
        void keepFromUrl(detail.url, detail.filename);
      },
      true,
    );
    return btn;
  };

  const layoutDownloadButton = (el, btn, visible) => {
    if (!btn) return;
    const box = visible ? visibleMediaBox(el) : null;
    if (!box) {
      btn.style.display = 'none';
      btn.style.visibility = 'hidden';
      return;
    }
    const topOff = isStoriesPath() ? 64 : isReelsPath() ? 16 : 46;
    const left = box.right - 50;
    const top = box.top + topOff;
    const cx = left + 18;
    const cy = top + 18;
    if (cx < box.left || cx > box.right || cy < box.top || cy > box.bottom - 24) {
      btn.style.display = 'none';
      btn.style.visibility = 'hidden';
      return;
    }
    btn.style.display = 'flex';
    btn.style.visibility = 'visible';
    btn.style.left = `${Math.round(left)}px`;
    btn.style.top = `${Math.round(top)}px`;
  };

  const layoutPlayerBar = (video, bar, visible) => {
    if (!bar) return;
    const box = visible ? visibleMediaBox(video) : null;
    if (!box) {
      bar.style.display = 'none';
      bar.style.visibility = 'hidden';
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
    const fsBtn = createFullscreenButton(isReelsPath() ? 'reels' : 'feed');
    fsBtn.dataset.igNvcFor = video.dataset.igNvcId;
    (document.body || document.documentElement).appendChild(fsBtn);
    layoutFullscreenButton(video, fsBtn, true);

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

    const updatePreview = (event) => {
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      ensurePreviewUi().show(event.clientX, rect, video, pct);
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
      updatePreview(event);
    };
    const onMove = (event) => {
      if (!dragging) return;
      event.preventDefault();
      event.stopPropagation();
      seekFromEvent(event);
      updatePreview(event);
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
      if (previewUi) previewUi.hide();
    };

    bar.addEventListener('pointerenter', updatePreview);
    bar.addEventListener('pointermove', (event) => {
      if (!dragging) updatePreview(event);
    });
    bar.addEventListener('pointerleave', () => {
      if (!dragging && previewUi) previewUi.hide();
    });
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
      fsBtn,
      cleanup: () => {
        if (raf) cancelAnimationFrame(raf);
        if (previewUi && previewUi.activeMedia === video) {
          previewUi.hide();
          previewUi.resetForMedia(null);
        }
        video.removeEventListener('play', ensureTick);
        video.removeEventListener('playing', ensureTick);
        video.removeEventListener('seeked', updateFill);
        video.removeEventListener('loadedmetadata', updateFill);
        video.removeEventListener('pause', updateFill);
        video.removeEventListener('ended', updateFill);
        bar.remove();
        dlBtn.remove();
        fsBtn.remove();
      },
    });
  };

  const teardownStoryBar = () => {
    if (!storyUi) return;
    if (previewUi) previewUi.hide();
    storyUi.stop();
    window.removeEventListener('resize', storyUi.layout);
    document.removeEventListener('scroll', storyUi.layout, true);
    storyUi.bar.remove();
    if (storyUi.dlBtn) storyUi.dlBtn.remove();
    if (storyUi.fsBtn) storyUi.fsBtn.remove();
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
    dlBtn.classList.add('ig-nvc-story-k');
    (document.body || document.documentElement).appendChild(dlBtn);
    const fsBtn = createFullscreenButton('story');
    (document.body || document.documentElement).appendChild(fsBtn);

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

    const layout = (force) => {
      const el = media;
      if (!el || !el.isConnected) {
        bar.style.display = 'none';
        dlBtn.style.display = 'none';
        fsBtn.style.display = 'none';
        return;
      }
      const rect =
        document.documentElement.classList.contains('ig-nvc-fs') && el.classList.contains('ig-nvc-fs-target')
          ? {
              left: 0,
              top: 0,
              width: window.innerWidth,
              height: window.innerHeight,
              right: window.innerWidth,
              bottom: window.innerHeight,
            }
          : el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        bar.style.display = 'none';
        dlBtn.style.display = 'none';
        fsBtn.style.display = 'none';
        return;
      }
      const isVideo = video instanceof HTMLVideoElement;
      const box = `${rect.left | 0},${rect.top | 0},${rect.width | 0},${isVideo ? 1 : 0},${document.documentElement.classList.contains('ig-nvc-fs') ? 1 : 0}`;
      if (!force && box === lastBox) return;
      lastBox = box;
      if (isVideo) {
        bar.style.display = 'block';
        bar.style.visibility = 'visible';
        bar.style.left = `${rect.left}px`;
        bar.style.width = `${rect.width}px`;
        bar.style.top = `${rect.top}px`;
        layoutDownloadButton(el, dlBtn, true);
      } else {
        bar.style.display = 'none';
        bar.style.visibility = 'hidden';
        layoutDownloadButton(el, dlBtn, false);
      }
      layoutFullscreenButton(el, fsBtn, true);
    };

    const bindMedia = (next) => {
      if (!next || next === media) {
        layout();
        return;
      }
      media = next;
      video = next instanceof HTMLVideoElement ? next : null;
      bar.dataset.igNvcFor = tagMedia(next);
      fsBtn.dataset.igNvcFor = bar.dataset.igNvcFor;
      if (video) dlBtn.dataset.igNvcFor = video.dataset.igNvcId;
      else delete dlBtn.dataset.igNvcFor;
      bar.classList.remove('ig-nvc-hover', 'ig-nvc-drag');
      if (previewUi) previewUi.hide();
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
      if (
        !document.documentElement.classList.contains('ig-nvc-fs') &&
        (pathChanged || !isCenteredStory(media))
      ) {
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

    const updatePreview = (event) => {
      if (!(video instanceof HTMLVideoElement) || !isFinite(video.duration) || video.duration <= 0) return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      ensurePreviewUi().show(event.clientX, rect, video, pct, true);
    };

    bar.addEventListener('pointerenter', updatePreview);
    bar.addEventListener('pointermove', (event) => {
      if (!dragging) updatePreview(event);
    });
    bar.addEventListener('pointerleave', () => {
      if (!dragging && previewUi) previewUi.hide();
    });

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
      updatePreview(event);
    });
    bar.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      event.preventDefault();
      event.stopPropagation();
      seekFromEvent(event);
      updatePreview(event);
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
      if (previewUi) previewUi.hide();
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
      fsBtn,
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
      if (entry.fsBtn) entry.fsBtn.style.display = 'none';
    }
  };

  const syncStoryBar = () => {
    if (document.documentElement.classList.contains('ig-nvc-fs')) {
      if (storyUi) storyUi.layout(true);
      layoutFsControls();
      return;
    }
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
        if (storyUi.fsBtn) storyUi.fsBtn.style.display = 'none';
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
    if (document.documentElement.classList.contains('ig-nvc-fs')) {
      retargetFsMedia();
      relayoutFs();
      return;
    }
    if (isStoriesPath()) {
      hideFeedChrome();
      return;
    }
    document.documentElement.classList.remove('ig-nvc-stories');
    teardownStoryBar();
    document.querySelectorAll('video').forEach(enable);
    const primaryVideo = findBestVisibleVideo();
    if (primaryVideo) {
      ensurePreviewUi().preload(primaryVideo);
    }
    for (const [video, entry] of scrubbers) {
      if (!video.isConnected) {
        entry.cleanup();
        scrubbers.delete(video);
        continue;
      }
      const show = video === primaryVideo;
      layoutPlayerBar(video, entry.bar, show);
      layoutDownloadButton(video, entry.dlBtn, show);
      layoutFullscreenButton(video, entry.fsBtn, show);
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
    if (path !== lastPath && document.documentElement.classList.contains('ig-nvc-fs')) {
      exitFullscreen();
    }
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
      if (document.documentElement.classList.contains('ig-nvc-fs')) {
        relayoutFs();
        return;
      }
      if (isStoriesPath()) storyUi && storyUi.layout();
      else scanFeed();
    },
    { passive: true },
  );

  const onFsChange = () => {
    if (isFsActive()) {
      const media = pendingFsMedia || fsState.media || pickFallbackFsMedia();
      if (media) applyCinema(media);
      relayoutFs();
      return;
    }
    pendingFsMedia = null;
    if (!document.documentElement.classList.contains('ig-nvc-fs')) return;
    cleanupFsChrome();
    if (isStoriesPath()) {
      if (storyUi) storyUi.layout(true);
    } else {
      scanFeed();
    }
  };
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  const onMediaPlayPause = (event) => {
    if (event.target === fsState.media) syncPlayPauseIcon();
  };
  document.addEventListener('play', onMediaPlayPause, true);
  document.addEventListener('playing', onMediaPlayPause, true);
  document.addEventListener('pause', onMediaPlayPause, true);
  document.addEventListener('ended', onMediaPlayPause, true);
})();
