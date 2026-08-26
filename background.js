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
  if (typeof origin === 'string' && /^https:\/\/(www\.)?instagram\.com$/i.test(origin)) return true;
  const url = sender && sender.url;
  if (typeof url === 'string' && INSTAGRAM_PAGE.test(url)) return true;
  return !!(sender && sender.tab);
};

const sanitizeFilename = (raw) => {
  const name = typeof raw === 'string' ? raw : `ibc-${Date.now()}.mp4`;
  const cleaned = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim();
  if (!cleaned) return `ibc-${Date.now()}.mp4`;
  return cleaned.toLowerCase().endsWith('.mp4') ? cleaned : `${cleaned}.mp4`;
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'seekstrip-open-grant') {
    chrome.tabs.create({ url: chrome.runtime.getURL('grant.html') });
    sendResponse({ ok: true });
    return;
  }

  if (msg.type !== 'seekstrip-download' || typeof msg.url !== 'string') return;
  if (!isAllowedDownloadUrl(msg.url) || !isInstagramSender(sender)) {
    sendResponse({ ok: false, error: 'blocked' });
    return;
  }

  const filename = sanitizeFilename(msg.filename);
  chrome.downloads.download(
    {
      url: msg.url,
      filename,
      saveAs: true,
      conflictAction: 'uniquify',
    },
    (id) => {
      sendResponse({
        ok: !chrome.runtime.lastError && typeof id === 'number',
        error: chrome.runtime.lastError && chrome.runtime.lastError.message,
      });
    },
  );
  return true;
});
