const DOWNLOAD_ORIGINS = [
  'https://*.cdninstagram.com/*',
  'https://*.fbcdn.net/*',
];

const statusEl = document.getElementById('perm-status');
const grantBtn = document.getElementById('grant-btn');

const setStatus = (text, showButton) => {
  statusEl.textContent = text;
  grantBtn.hidden = !showButton;
};

const refresh = async () => {
  const has = await chrome.permissions.contains({
    permissions: ['downloads'],
    origins: DOWNLOAD_ORIGINS,
  });
  if (has) {
    setStatus('Saving videos is allowed. Click the on-page save button, then pick a file location.', false);
  } else {
    setStatus('Saving is optional. Grant permission the first time you use the save button.', true);
  }
};

grantBtn.addEventListener('click', async () => {
  const granted = await chrome.permissions.request({
    permissions: ['downloads'],
    origins: DOWNLOAD_ORIGINS,
  });
  if (granted) {
    await chrome.storage.local.set({ seekstripConsent: true });
    setStatus('Saving videos is allowed. Click the on-page save button, then pick a file location.', false);
  } else {
    setStatus('Permission was not granted. You can still use the seek bar.', true);
  }
});

refresh();
