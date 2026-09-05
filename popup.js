const statusEl = document.getElementById('perm-status');
if (statusEl) {
  statusEl.textContent = 'Open Instagram and click Keep on a video. It saves to your download folder.';
}

const adobeToggle = document.getElementById('adobe-compat');
if (adobeToggle && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get({ adobeCompat: false }, (res) => {
    adobeToggle.checked = !!(res && res.adobeCompat);
  });

  adobeToggle.addEventListener('change', () => {
    chrome.storage.local.set({ adobeCompat: adobeToggle.checked });
  });
}
