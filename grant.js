const DOWNLOAD_ORIGINS = [
  'https://*.cdninstagram.com/*',
  'https://*.fbcdn.net/*',
];

const statusEl = document.getElementById('perm-status');
const grantBtn = document.getElementById('grant-btn');

grantBtn.addEventListener('click', async () => {
  const granted = await chrome.permissions.request({
    permissions: ['downloads'],
    origins: DOWNLOAD_ORIGINS,
  });
  if (granted) {
    await chrome.storage.local.set({ seekstripConsent: true });
    statusEl.textContent = 'Permission granted. You can close this tab and use the save button on Instagram.';
    grantBtn.hidden = true;
  } else {
    statusEl.textContent = 'Permission was not granted. The seek bar still works without it.';
  }
});
