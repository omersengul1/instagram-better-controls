# Instagram Better Controls

Chrome MV3 extension. Adds a seek bar to Reels, posts, and Stories on Instagram.

Instagram Better Controls is an independent product. It is **not affiliated with, endorsed by, or produced by Meta or Instagram**.

Keeping a video is optional. The extension does not send files, cookies, or account data to our servers. Chrome Web Store still treats local-save features as high-risk; reviewers may reject the item under the copyright / unauthorized download policy.

## Load unpacked

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. **Load unpacked** and select this folder (the one with `manifest.json`).
4. Reload the extension, then hard-refresh Instagram (`Ctrl+Shift+R`).

## What it does

- **Seek bar** on Reels, feed/post videos, and Stories.
- **Keep** on videos: after an on-page confirmation, Chrome asks for the `downloads` permission and a Save As location. Only `cdninstagram.com` / `fbcdn.net` HTTPS URLs are fetched.

## Store submission

Copy-paste texts, permission justifications, and screenshot notes are in [`store/LISTING.md`](store/LISTING.md).

1. Host [`privacy.html`](privacy.html) on a public HTTPS URL (GitHub Pages is fine) and paste that URL into the dashboard Privacy fields.
2. Upload `store/promo-small-440x280.png` as the small promo tile.
3. Add at least one 1280×800 screenshot of the **real** seek bar / keep button (see `store/LISTING.md`).
4. Pack a ZIP with `pack.ps1` (manifest at the zip root) and upload it.

Developer account: one-time $5 fee and 2-Step Verification are required before publish.
