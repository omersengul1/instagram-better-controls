(() => {
  let restoredLayers = [];
  let saveGhost = null;
  let restoreTimer = 0;

  const OUR_UI = '.ig-nvc-bar, .ig-nvc-k, .ig-nvc-fs-btn, .ig-nvc-fs-play, .ig-nvc-fs-exit, .ig-nvc-fs-hit';
  const isOurUiNode = (node) => !!(node && node.closest && node.closest(OUR_UI));

  const imageAtPoint = (event) => {
    if (typeof event.clientX !== 'number' || typeof event.clientY !== 'number') return null;
    const stack = document.elementsFromPoint(event.clientX, event.clientY) || [];
    return (
      stack.find(
        (node) =>
          node instanceof HTMLImageElement &&
          node.naturalWidth > 1 &&
          !isOurUiNode(node),
      ) || null
    );
  };

  const restoreImageLayers = () => {
    restoredLayers.forEach(([node, pe, z]) => {
      node.style.pointerEvents = pe;
      node.style.zIndex = z;
    });
    restoredLayers = [];
    if (saveGhost) {
      saveGhost.remove();
      saveGhost = null;
    }
  };

  const scheduleRestore = () => {
    if (restoreTimer) clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => {
      restoreTimer = 0;
      restoreImageLayers();
    }, 800);
  };

  const uncoverImageForSave = (event) => {
    const img = imageAtPoint(event);
    if (!img) return;
    const stack = document.elementsFromPoint(event.clientX, event.clientY) || [];
    for (const node of stack) {
      if (node === img) break;
      if (!(node instanceof HTMLElement)) continue;
      if (isOurUiNode(node)) continue;
      restoredLayers.push([node, node.style.pointerEvents, node.style.zIndex]);
      node.style.setProperty('pointer-events', 'none', 'important');
    }
    img.style.setProperty('pointer-events', 'auto', 'important');
    img.style.setProperty('z-index', '2147483646', 'important');
    if (saveGhost) saveGhost.remove();
    saveGhost = img.cloneNode(true);
    saveGhost.removeAttribute('class');
    saveGhost.style.cssText = [
      'position:fixed',
      `left:${event.clientX - 2}px`,
      `top:${event.clientY - 2}px`,
      'width:4px',
      'height:4px',
      'opacity:0.01',
      'z-index:2147483647',
      'pointer-events:auto',
      'margin:0',
      'padding:0',
    ].join(';');
    (document.body || document.documentElement).appendChild(saveGhost);
  };

  const origPreventDefault = Event.prototype.preventDefault;
  Event.prototype.preventDefault = function preventDefault() {
    if (this.type === 'contextmenu' && (imageAtPoint(this) || isOurUiNode(this.target))) return;
    if (
      (this.type === 'pointerdown' || this.type === 'mousedown') &&
      this.button === 2 &&
      !isOurUiNode(this.target)
    ) {
      return;
    }
    return origPreventDefault.apply(this, arguments);
  };

  const onRightPointer = (event) => {
    if (event.button !== 2) return;
    if (isOurUiNode(event.target)) return;
    event.stopImmediatePropagation();
    if (event.type === 'pointerdown') uncoverImageForSave(event);
  };

  window.addEventListener('pointerdown', onRightPointer, true);
  window.addEventListener('mousedown', onRightPointer, true);
  window.addEventListener(
    'pointerup',
    (event) => {
      if (event.button === 2) scheduleRestore();
    },
    true,
  );
  window.addEventListener(
    'contextmenu',
    (event) => {
      if (isOurUiNode(event.target)) return;
      event.stopImmediatePropagation();
      if (imageAtPoint(event) || event.target instanceof HTMLImageElement) {
        scheduleRestore();
      }
    },
    true,
  );

  const origSetAttribute = Element.prototype.setAttribute;
  const origRemoveAttribute = Element.prototype.removeAttribute;
  const origToggleAttribute = Element.prototype.toggleAttribute;

  const controlsDesc = Object.getOwnPropertyDescriptor(
    HTMLMediaElement.prototype,
    'controls',
  );
  if (!controlsDesc || typeof controlsDesc.get !== 'function' || typeof controlsDesc.set !== 'function') {
    return;
  }

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

  const shouldLock = (el) => el instanceof HTMLVideoElement && isInScope(el);

  const forceOff = (video) => {
    controlsDesc.set.call(video, false);
    origRemoveAttribute.call(video, 'controls');
  };

  const unescapeIgUrl = (url) =>
    String(url)
      .replace(/\\u0026/gi, '&')
      .replace(/\\u002F/gi, '/')
      .replace(/\\\//g, '/');

  const isAllowedCdnHost = (url) => {
    try {
      const host = new URL(unescapeIgUrl(url)).hostname;
      return /(^|\.)cdninstagram\.com$/i.test(host) || /(^|\.)fbcdn\.net$/i.test(host);
    } catch (_) {
      return false;
    }
  };

  const isVideoHttpUrl = (value) => {
    const url = String(value || '');
    if (!/^https:\/\//i.test(url)) return false;
    if (/\.(jpe?g|png|webp|gif|heic|bmp)(\?|$)/i.test(url)) return false;
    if (/\.m3u8(\?|$)/i.test(url)) return false;
    return isAllowedCdnHost(url);
  };

  const urlByCode = new Map();
  const urlByPk = new Map();
  const recentMedia = [];

  const bestVersionUrl = (versions) => {
    if (!Array.isArray(versions) || !versions.length) return '';
    const best = versions.reduce((a, b) => (((b && b.width) || 0) > ((a && a.width) || 0) ? b : a));
    return best && isVideoHttpUrl(best.url) ? unescapeIgUrl(best.url) : '';
  };

  const rememberMedia = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    const url =
      bestVersionUrl(obj.video_versions) ||
      (isVideoHttpUrl(obj.video_url) ? unescapeIgUrl(obj.video_url) : '');
    if (!url) return;
    const code = obj.code || obj.shortcode;
    const pk = obj.pk || obj.id;
    if (code) urlByCode.set(String(code), url);
    if (pk) urlByPk.set(String(pk), url);
    recentMedia.push({
      url,
      duration: Number(obj.video_duration) || 0,
      code: code ? String(code) : '',
      t: Date.now(),
    });
    if (recentMedia.length > 80) recentMedia.shift();
  };

  const harvestObject = (root) => {
    if (!root || typeof root !== 'object') return;
    const seen = new Set();
    const stack = [root];
    let n = 0;
    while (stack.length && n < 8000) {
      n += 1;
      const obj = stack.pop();
      if (!obj || typeof obj !== 'object' || seen.has(obj)) continue;
      try {
        seen.add(obj);
      } catch (_) {
        continue;
      }
      if (Array.isArray(obj.video_versions) && obj.video_versions.length) rememberMedia(obj);
      else if (isVideoHttpUrl(obj.video_url)) rememberMedia(obj);
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i += 1) stack.push(obj[i]);
      } else {
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i += 1) {
          const v = obj[keys[i]];
          if (v && typeof v === 'object') stack.push(v);
        }
      }
    }
  };

  const harvestText = (text) => {
    if (!text || text.length < 40) return;
    if (!text.includes('video_versions') && !text.includes('.mp4')) return;
    try {
      harvestObject(JSON.parse(text));
    } catch (_) {}
    const re = /https:\\u002F\\u002F[^"\\]+?\.mp4[^"\\]*/g;
    let m = re.exec(text);
    while (m) {
      const url = unescapeIgUrl(m[0]);
      if (isVideoHttpUrl(url)) {
        recentMedia.push({ url, duration: 0, code: '', t: Date.now() });
        if (recentMedia.length > 80) recentMedia.shift();
      }
      m = re.exec(text);
    }
  };

  // Read media URLs only from responses the page already made. No extra API calls.
  const origFetch = window.fetch;
  window.fetch = function igNvcFetch(...args) {
    const p = origFetch.apply(this, args);
    p.then((res) => {
      try {
        const url = (res && res.url) || '';
        if (!/\/graphql|\/api\/v1\/|\/api\/graphql/i.test(url)) return;
        res.clone().text().then(harvestText).catch(() => {});
      } catch (_) {}
    }).catch(() => {});
    return p;
  };

  const origXhrOpen = XMLHttpRequest.prototype.open;
  const origXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function igNvcXhrOpen(method, url, ...rest) {
    this._igNvcUrl = url;
    return origXhrOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function igNvcXhrSend(...args) {
    this.addEventListener('load', function igNvcXhrLoad() {
      try {
        const url = String(this._igNvcUrl || '');
        if (!/\/graphql|\/api\/v1\/|\/api\/graphql/i.test(url) && !/\/graphql|\/api\/v1\/|\/api\/graphql/i.test(this.responseURL || '')) {
          return;
        }
        harvestText(this.responseText);
      } catch (_) {}
    });
    return origXhrSend.apply(this, args);
  };

  const rememberVideoSrc = (video, value) => {
    if (!(video instanceof HTMLVideoElement)) return;
    delete video.dataset.igNvcDl;
    delete video.dataset.igNvcForSrc;
    if (isVideoHttpUrl(value)) {
      const u = unescapeIgUrl(value);
      video.dataset.igNvcDl = u;
      video.dataset.igNvcForSrc = u;
    }
  };

  // Safe lookup of CDN URLs directly attached to this video's player node.
  // Never traverses multi-item parent collections (items, edges, posts).
  const extractVideoUrl = (obj, depth, seen, targetCode) => {
    if (!obj || depth > 8 || typeof obj !== 'object') return '';
    if (obj instanceof Node) return '';
    if (seen.has(obj)) return '';
    try {
      seen.add(obj);
    } catch (_) {
      return '';
    }

    const objCode = String(obj.code || obj.shortcode || '');
    if (targetCode && objCode && objCode !== targetCode) {
      return '';
    }

    if (Array.isArray(obj.video_versions) && obj.video_versions.length) {
      rememberMedia(obj);
      const url = bestVersionUrl(obj.video_versions);
      if (url) return url;
    }
    if (isVideoHttpUrl(obj.video_url)) return unescapeIgUrl(obj.video_url);
    if (isVideoHttpUrl(obj.playback_url) && String(obj.playback_url).includes('.mp4')) {
      return unescapeIgUrl(obj.playback_url);
    }

    const safeKeys = [
      'media', 'video', 'reel', 'clips_item',
      'xdt_shortcode_media', 'shortcode_media', 'clips_metadata',
    ];
    for (let i = 0; i < safeKeys.length; i += 1) {
      const k = safeKeys[i];
      if (obj[k] && typeof obj[k] === 'object') {
        const found = extractVideoUrl(obj[k], depth + 1, seen, targetCode);
        if (found) return found;
      }
    }

    return '';
  };

  // Inspects in-page React props already attached to the playing video node
  // so the save button can find the CDN URL the player is using. No network.
  const fiberOf = (el) => {
    if (!el) return null;
    const key = Object.keys(el).find(
      (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'),
    );
    return key ? el[key] : null;
  };

  const shortcodeOf = (video) => {
    if (!video || !(video instanceof HTMLElement)) return '';
    try {
      if (isStoriesPath()) {
        const story = String(location.pathname || '').match(/\/stories\/[^/]+\/(\d+)/);
        if (story && story[1]) return story[1];
      }

      let cur = video;
      for (let hop = 0; hop < 12 && cur && cur !== document.body; hop += 1) {
        const links = cur.querySelectorAll('a[href*="/reel/"], a[href*="/reels/"], a[href*="/p/"]');
        for (let i = 0; i < links.length; i += 1) {
          const href = links[i].getAttribute('href') || '';
          const m = href.match(/\/(reel|reels|p)\/([^/?#]+)/);
          if (m && m[2] && m[2] !== 'videos' && m[2] !== 'reels') {
            return m[2];
          }
        }
        cur = cur.parentElement;
      }

      const singleMatch = String(location.pathname || '').match(/^\/(reel|p)\/([^/?#]+)/);
      if (singleMatch && singleMatch[2] && singleMatch[2] !== 'videos') {
        return singleMatch[2];
      }

      return '';
    } catch (_) {
      return '';
    }
  };

  const lookupHarvested = (video) => {
    const code = shortcodeOf(video);
    if (code) {
      if (urlByCode.has(code)) return urlByCode.get(code);
      if (urlByPk.has(code)) return urlByPk.get(code);
    }
    return '';
  };

  const findVideoUrl = (video) => {
    if (!(video instanceof HTMLVideoElement)) return '';
    const curSrc = video.currentSrc || video.src || '';

    if (
      video.dataset.igNvcDl &&
      video.dataset.igNvcForSrc === curSrc &&
      isVideoHttpUrl(video.dataset.igNvcDl)
    ) {
      return video.dataset.igNvcDl;
    }

    if (curSrc && !curSrc.startsWith('blob:') && isVideoHttpUrl(curSrc)) {
      const u = unescapeIgUrl(curSrc);
      video.dataset.igNvcDl = u;
      video.dataset.igNvcForSrc = curSrc;
      return u;
    }

    const harvested = lookupHarvested(video);
    if (harvested) {
      video.dataset.igNvcDl = harvested;
      video.dataset.igNvcForSrc = curSrc;
      return harvested;
    }

    const targetCode = shortcodeOf(video);
    const seen = new Set();
    let el = video;
    for (let hop = 0; hop < 6 && el && el !== document.body; hop += 1) {
      let fiber = fiberOf(el);
      let depth = 0;
      while (fiber && depth < 8) {
        const url =
          extractVideoUrl(fiber.memoizedProps, 0, seen, targetCode) ||
          extractVideoUrl(fiber.pendingProps, 0, seen, targetCode);
        if (url) {
          video.dataset.igNvcDl = url;
          video.dataset.igNvcForSrc = curSrc;
          return url;
        }
        fiber = fiber.return;
        depth += 1;
      }
      el = el.parentElement;
    }

    return '';
  };

  const filenameFor = (video) => {
    const code = shortcodeOf(video);
    return `seekstrip-${code || Date.now()}.mp4`;
  };

  const startDownload = (video, btn) => {
    if (!(video instanceof HTMLVideoElement)) return;
    const url = findVideoUrl(video);
    const filename = filenameFor(video);
    if (btn) btn.title = url ? 'Keep video' : 'Video not found';
    if (url && isVideoHttpUrl(url) && isAllowedCdnHost(url)) {
      video.dataset.igNvcDl = url;
      video.dataset.igNvcForSrc = video.currentSrc || video.src || '';
    }
    document.documentElement.dispatchEvent(
      new CustomEvent('ig-nvc-keep', {
        bubbles: true,
        detail: {
          url: url && isVideoHttpUrl(url) && isAllowedCdnHost(url) ? url : '',
          filename,
        },
      }),
    );
  };

  document.addEventListener(
    'ig-nvc-ask-url',
    (event) => {
      const detail = event.detail;
      if (!detail) return;
      const directVideo =
        (detail.btnId && document.querySelector(`video[data-ig-nvc-id="${detail.btnId}"]`)) || null;
      const btn =
        !directVideo && detail.btnId
          ? document.querySelector(`.ig-nvc-k[data-ig-nvc-for="${detail.btnId}"]`)
          : null;
      const video = directVideo || (btn && videoForDownloadBtn(btn));
      if (!video) return;
      const url = findVideoUrl(video);
      if (!url || !isVideoHttpUrl(url) || !isAllowedCdnHost(url)) return;
      video.dataset.igNvcDl = url;
      video.dataset.igNvcForSrc = video.currentSrc || video.src || '';
      detail.url = url;
      detail.filename = filenameFor(video);
    },
    true,
  );

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    const data = event.data;
    if (!data || data.source !== 'ig-nvc') return;
    if (data.type === 'request-fs') {
      requestPageFullscreen();
    }
  });

  const mediaSrcDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  if (mediaSrcDesc && typeof mediaSrcDesc.get === 'function' && typeof mediaSrcDesc.set === 'function') {
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      configurable: true,
      enumerable: mediaSrcDesc.enumerable,
      get() {
        return mediaSrcDesc.get.call(this);
      },
      set(value) {
        rememberVideoSrc(this, value);
        return mediaSrcDesc.set.call(this, value);
      },
    });
  }

  const origPause = HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.pause = function igNvcPause() {
    try {
      const html = document.documentElement;
      if (
        html.classList.contains('ig-nvc-fs') &&
        this.classList.contains('ig-nvc-fs-target') &&
        html.dataset.igNvcUserPaused !== '1'
      ) {
        return;
      }
    } catch (_) {}
    return origPause.apply(this, arguments);
  };

  const origExitFullscreen = Document.prototype.exitFullscreen;
  const origWebkitExitFullscreen = Document.prototype.webkitExitFullscreen;

  const allowPageExitFullscreen = () =>
    document.documentElement.dataset.igNvcFsExit === '1' ||
    !document.documentElement.classList.contains('ig-nvc-fs');

  if (typeof origExitFullscreen === 'function') {
    Document.prototype.exitFullscreen = function igNvcExitFullscreen() {
      if (!allowPageExitFullscreen()) return Promise.resolve();
      return origExitFullscreen.apply(this, arguments);
    };
  }
  if (typeof origWebkitExitFullscreen === 'function') {
    Document.prototype.webkitExitFullscreen = function igNvcWebkitExitFullscreen() {
      if (!allowPageExitFullscreen()) return;
      return origWebkitExitFullscreen.apply(this, arguments);
    };
  }

  const requestPageFullscreen = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
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
    go(document.documentElement).catch(() => go(document.body)).catch(() => {});
  };

  Object.defineProperty(HTMLMediaElement.prototype, 'controls', {
    configurable: true,
    enumerable: controlsDesc.enumerable,
    get() {
      if (shouldLock(this)) return false;
      return controlsDesc.get.call(this);
    },
    set() {
      if (shouldLock(this)) {
        forceOff(this);
        return;
      }
      controlsDesc.set.apply(this, arguments);
    },
  });

  Element.prototype.setAttribute = function setAttribute(name, value) {
    if (this instanceof HTMLVideoElement && String(name).toLowerCase() === 'src') {
      rememberVideoSrc(this, value);
    }
    if (shouldLock(this) && String(name).toLowerCase() === 'controls') {
      forceOff(this);
      return;
    }
    return origSetAttribute.apply(this, arguments);
  };

  Element.prototype.removeAttribute = function removeAttribute(name) {
    if (shouldLock(this) && String(name).toLowerCase() === 'controls') {
      forceOff(this);
      return;
    }
    return origRemoveAttribute.apply(this, arguments);
  };

  if (typeof origToggleAttribute === 'function') {
    Element.prototype.toggleAttribute = function toggleAttribute(name, force) {
      if (shouldLock(this) && String(name).toLowerCase() === 'controls') {
        forceOff(this);
        return false;
      }
      return origToggleAttribute.apply(this, arguments);
    };
  }

  const applyAll = () => {
    document.querySelectorAll('video').forEach((video) => {
      if (shouldLock(video)) forceOff(video);
    });
  };

  let scanScheduled = false;
  const scheduleScan = () => {
    if (scanScheduled) return;
    scanScheduled = true;
    requestAnimationFrame(() => {
      scanScheduled = false;
      applyAll();
    });
  };

  const EDGE_PX = 0;
  let dragging = null;

  const isStoriesPath = () => (location.pathname || '').startsWith('/stories/');

  const barForVideo = (video) => {
    const id = video.dataset.igNvcId;
    if (id) {
      const tagged = document.querySelector(`.ig-nvc-bar[data-ig-nvc-for="${id}"]`);
      if (tagged) return tagged;
    }
    return video.parentElement?.querySelector(':scope > .ig-nvc-bar') || null;
  };

  const setBarHover = (video, on) => {
    const bar = barForVideo(video);
    if (bar) bar.classList.toggle('ig-nvc-hover', !!on);
  };

  const isOnVideo = (event, video) => {
    const rect = video.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  };

  const videoForHover = (event) => {
    let best = null;
    let bestArea = 0;
    document.querySelectorAll('video').forEach((video) => {
      const wantsHover = shouldLock(video) || isStoriesPath();
      if (!wantsHover || !isOnVideo(event, video)) return;
      const rect = video.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area > bestArea) {
        bestArea = area;
        best = video;
      }
    });
    return best;
  };

  const isNativeControlHit = (event) => {
    const t = event.target;
    if (!t || !t.closest) return false;
    if (t.closest(OUR_UI)) return false;
    if (t.closest('button, [role="button"], a')) return true;
    const svg = t.closest('svg');
    if (!svg) return false;
    const labeled = svg.closest('[aria-label], [role="button"], button');
    if (labeled && labeled !== document.body) return true;
    return false;
  };

  const isOnScrubStrip = (event, video) => {
    const bar = barForVideo(video);
    if (!bar || bar.style.display === 'none' || bar.style.visibility === 'hidden') return false;
    const br = bar.getBoundingClientRect();
    if (br.width < 2 || br.height < 2) return false;
    return (
      event.clientX >= br.left &&
      event.clientX <= br.right &&
      event.clientY >= br.top &&
      event.clientY <= br.bottom
    );
  };

  const videoForScrub = (event) => {
    let best = null;
    let bestArea = 0;
    document.querySelectorAll('video').forEach((video) => {
      if (!shouldLock(video) || !isOnScrubStrip(event, video)) return;
      const rect = video.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area > bestArea) {
        bestArea = area;
        best = video;
      }
    });
    return best;
  };

  const syncBarHover = (event) => {
    const active =
      dragging && dragging.video && dragging.video.isConnected
        ? dragging.video
        : videoForHover(event);
    const stripVideo = videoForScrub(event);
    document.querySelectorAll('video').forEach((video) => {
      const bar = barForVideo(video);
      if (!bar) return;
      setBarHover(video, video === active);
      bar.classList.toggle('ig-nvc-strip-hover', video === stripVideo);
    });
  };

  const seekFromRect = (video, rect, event) => {
    if (!rect || rect.width <= 0 || !isFinite(video.duration) || video.duration <= 0) return;
    const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    video.currentTime = pct * video.duration;
  };

  const seekVideo = (video, event) => {
    const bar = barForVideo(video);
    const br = bar && bar.getBoundingClientRect();
    if (br && br.width > 2) {
      seekFromRect(video, { left: br.left, width: br.width }, event);
      return;
    }
    const rect = video.getBoundingClientRect();
    seekFromRect(video, { left: rect.left + EDGE_PX, width: rect.width - EDGE_PX * 2 }, event);
  };

  const visibleStoryVideo = () => {
    let best = null;
    let bestArea = 0;
    document.querySelectorAll('video').forEach((video) => {
      if (!(video instanceof HTMLVideoElement)) return;
      const rect = video.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80) return;
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const area = rect.width * rect.height;
      if (area > bestArea) {
        bestArea = area;
        best = video;
      }
    });
    return best;
  };

  const canSeekVideo = (video) =>
    video instanceof HTMLVideoElement && isFinite(video.duration) && video.duration > 0;

  const pointInRect = (event, r) =>
    event.clientX >= r.left &&
    event.clientX <= r.left + r.width &&
    event.clientY >= r.top &&
    event.clientY <= r.bottom;

  const ourStoryBar = () => document.querySelector('.ig-nvc-bar.ig-nvc-story');

  const storyScrubTarget = (event) => {
    if (!isStoriesPath()) return null;
    const bar = ourStoryBar();
    if (!bar || bar.style.display === 'none') return null;
    const br = bar.getBoundingClientRect();
    if (br.width < 2 || br.height < 2) return null;
    if (!pointInRect(event, { left: br.left, width: br.width, top: br.top, bottom: br.bottom })) {
      return null;
    }
    const video = visibleStoryVideo();
    if (!canSeekVideo(video)) return null;
    return { video, rect: { left: br.left, width: br.width } };
  };

  const swallowNativeStoryProgress = (event) => {
    if (!isStoriesPath()) return false;
    if (storyScrubTarget(event)) return false;
    const video = visibleStoryVideo();
    const el = video || document.querySelector('[role="dialog"] img');
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 80) return false;
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.top + 18
    );
  };

  const isOurDownload = (event) => {
    const t = event.target;
    return !!(t && t.closest && t.closest('.ig-nvc-k'));
  };

  const downloadButtonAt = (event) => {
    const buttons = document.querySelectorAll('.ig-nvc-k');
    for (let i = 0; i < buttons.length; i += 1) {
      const btn = buttons[i];
      if (btn.style.display === 'none') continue;
      const r = btn.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (
        event.clientX >= r.left - 6 &&
        event.clientX <= r.right + 6 &&
        event.clientY >= r.top - 6 &&
        event.clientY <= r.bottom + 6
      ) {
        return btn;
      }
    }
    return null;
  };

  const videoForDownloadBtn = (btn) => {
    const id = btn && btn.dataset && btn.dataset.igNvcFor;
    if (id) {
      const tagged = document.querySelector(`video[data-ig-nvc-id="${id}"]`);
      if (tagged instanceof HTMLVideoElement) return tagged;
    }
    let best = null;
    let bestArea = 0;
    document.querySelectorAll('video').forEach((video) => {
      if (!(video instanceof HTMLVideoElement) || !video.isConnected) return;
      const rect = video.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80) return;
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const area = rect.width * rect.height;
      if (area > bestArea) {
        bestArea = area;
        best = video;
      }
    });
    return best;
  };

  const onScrubDown = (event) => {
    if (event.button !== 0) return;
    const t = event.target;
    if (t && t.closest) {
      if (t.closest('.ig-nvc-fs-exit')) {
        document.documentElement.dataset.igNvcFsExit = '1';
        try {
          if (origExitFullscreen) origExitFullscreen.call(document);
          else if (origWebkitExitFullscreen) origWebkitExitFullscreen.call(document);
        } catch (_) {}
        return;
      }
      if (t.closest('.ig-nvc-fs-btn')) {
        requestPageFullscreen();
        return;
      }
      if (t.closest('.ig-nvc-fs-play, .ig-nvc-fs-hit')) return;
    }
    if (isNativeControlHit(event)) return;
    const dlBtn = downloadButtonAt(event);
    if (dlBtn || isOurDownload(event)) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }
    const story = storyScrubTarget(event);
    if (story) {
      event.stopImmediatePropagation();
      event.preventDefault();
      dragging = { kind: 'story', video: story.video, rect: story.rect };
      seekFromRect(story.video, story.rect, event);
      setBarHover(story.video, true);
      return;
    }
    const video = videoForScrub(event);
    if (!video) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    dragging = { kind: 'reel', video };
    seekVideo(video, event);
    setBarHover(video, true);
  };

  let hoverRaf = 0;
  const onScrubMove = (event) => {
    if (dragging && dragging.video && dragging.video.isConnected) {
      event.stopImmediatePropagation();
      event.preventDefault();
      if (dragging.kind === 'story') {
        seekFromRect(dragging.video, dragging.rect, event);
        setBarHover(dragging.video, true);
      } else {
        seekVideo(dragging.video, event);
        setBarHover(dragging.video, true);
      }
      return;
    }
    dragging = null;
    if (hoverRaf) return;
    hoverRaf = requestAnimationFrame(() => {
      hoverRaf = 0;
      syncBarHover(event);
    });
  };

  const onScrubUp = (event) => {
    if (dragging) {
      event.stopImmediatePropagation();
      event.preventDefault();
      dragging = null;
    }
    syncBarHover(event);
  };

  const start = () => {
    applyAll();
    const root = document.documentElement || document.body;
    if (!root) return;
    new MutationObserver(scheduleScan).observe(root, {
      childList: true,
      subtree: true,
    });
    window.addEventListener(
      'pointerdown',
      (event) => {
        if (event.button !== 0) return;
        const t = event.target;
        if (!t || !t.closest) return;
        if (t.closest('.ig-nvc-fs-btn')) requestPageFullscreen();
      },
      true,
    );
    document.addEventListener('pointerdown', onScrubDown, true);
    document.addEventListener('pointermove', onScrubMove, true);
    document.addEventListener('pointerup', onScrubUp, true);
    document.addEventListener('pointercancel', onScrubUp, true);
    document.addEventListener('click', (event) => {
      if (event.button !== 0) return;
      const t = event.target;
      if (t && t.closest && t.closest('.ig-nvc-fs-btn')) {
        requestPageFullscreen();
        return;
      }
      if (t && t.closest && t.closest('.ig-nvc-fs-play, .ig-nvc-fs-exit, .ig-nvc-fs-hit')) return;
      if (isNativeControlHit(event)) return;
      if (isOurDownload(event) || downloadButtonAt(event)) {
        event.stopImmediatePropagation();
        event.preventDefault();
        const dlBtn = downloadButtonAt(event) || (t && t.closest && t.closest('.ig-nvc-k'));
        const video = videoForDownloadBtn(dlBtn);
        if (video) startDownload(video, dlBtn);
        return;
      }
      if (!dragging && !videoForScrub(event) && !storyScrubTarget(event)) return;
      event.stopImmediatePropagation();
      event.preventDefault();
    }, true);
  };

  if (document.documentElement) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
