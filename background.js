const CDN_HOST = /(^|\.)cdninstagram\.com$/i;
const FBCDN_HOST = /(^|\.)fbcdn\.net$/i;
const INSTAGRAM_PAGE = /^https:\/\/(www\.)?instagram\.com\//i;

const isAllowedDownloadUrl = (urlStr) => {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== 'https:') return false;
    return CDN_HOST.test(url.hostname) || FBCDN_HOST.test(url.hostname);
  } catch (_) {
    return false;
  }
};

const isInstagramSender = (sender) => {
  const tabUrl = sender && sender.tab && sender.tab.url;
  if (typeof tabUrl === 'string' && INSTAGRAM_PAGE.test(tabUrl)) return true;
  const origin = sender && sender.origin;
  if (typeof origin === 'string' && /^https:\/\/(www\.)?instagram\.com$/i.test(origin)) {
    return true;
  }
  const url = sender && sender.url;
  if (typeof url === 'string' && INSTAGRAM_PAGE.test(url)) return true;
  return !!(sender && sender.tab && sender.tab.id);
};

const sanitizeFilename = (raw) => {
  const name = typeof raw === 'string' ? raw : `ibc-${Date.now()}.mp4`;
  const cleaned = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim();
  if (!cleaned) return `ibc-${Date.now()}.mp4`;
  return cleaned.toLowerCase().endsWith('.mp4') ? cleaned : `${cleaned}.mp4`;
};

const watched = new Map();
let watchingDownloads = false;

const onDownloadChanged = (delta) => {
  if (!delta || !delta.id || !delta.state) return;
  const rec = watched.get(delta.id);
  if (!rec) return;
  if (delta.state.current === 'complete') {
    watched.delete(delta.id);
    return;
  }
  if (delta.state.current !== 'interrupted') return;
  watched.delete(delta.id);
  const error = (delta.error && delta.error.current) || 'interrupted';
  if (error === 'USER_CANCELED' || error === 'USER_SHUTDOWN') return;
  try {
    chrome.tabs.sendMessage(rec.tabId, {
      type: 'seekstrip-download-failed',
      url: rec.url,
      filename: rec.filename,
      error,
    });
  } catch (_) {}
};

const ensureDownloadWatch = () => {
  if (watchingDownloads) return;
  if (!chrome.downloads || !chrome.downloads.onChanged) return;
  watchingDownloads = true;
  chrome.downloads.onChanged.addListener(onDownloadChanged);
};

const downloadOnce = (options) =>
  new Promise((resolve) => {
    if (!chrome.downloads || !chrome.downloads.download) {
      resolve({ ok: false, id: 0, error: 'downloads unavailable' });
      return;
    }
    try {
      chrome.downloads.download(options, (id) => {
        const err = chrome.runtime.lastError && chrome.runtime.lastError.message;
        resolve({
          ok: !err && typeof id === 'number',
          id: typeof id === 'number' ? id : 0,
          error: err || '',
        });
      });
    } catch (err) {
      resolve({ ok: false, id: 0, error: String((err && err.message) || err) });
    }
  });

const startDownload = async (url, filename, tabId) => {
  ensureDownloadWatch();
  const attempts = [
    { url, filename, saveAs: false, conflictAction: 'uniquify' },
    { url, saveAs: false, conflictAction: 'uniquify' },
  ];
  let last = { ok: false, id: 0, error: 'failed' };
  for (let i = 0; i < attempts.length; i += 1) {
    last = await downloadOnce(attempts[i]);
    if (last.ok) {
      if (tabId && last.id) watched.set(last.id, { tabId, url, filename });
      return last;
    }
  }
  return last;
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== 'object') return;
  if (msg.type !== 'seekstrip-download' || typeof msg.url !== 'string') return;
  if (!isAllowedDownloadUrl(msg.url) || !isInstagramSender(sender)) {
    sendResponse({ ok: false, error: 'blocked' });
    return;
  }

  const filename = sanitizeFilename(msg.filename);
  const tabId = sender && sender.tab && sender.tab.id;
  startDownload(msg.url, filename, tabId).then((result) => {
    sendResponse({
      ok: result.ok,
      error: result.error || '',
    });
  });
  return true;
});
