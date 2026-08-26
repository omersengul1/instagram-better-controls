# Chrome Web Store listing copy

Use these fields in the Developer Dashboard. Keep them accurate; they must match the extension’s behavior.

**Name:** Instagram Better Controls

**Short description (manifest, max 132 characters):**
Adds a seek bar to Reels, posts, and Stories on Instagram.

## Detailed description

Instagram Better Controls adds a thin seek bar to videos on Instagram so you can jump around Reels, posts, and Stories.

Instagram Better Controls is not affiliated with, endorsed by, or produced by Meta or Instagram.

What you can do:
- Scrub Reels and feed videos with an on-page progress bar
- Scrub Stories from the progress strip

What this extension does not do:
- It does not send your videos, cookies, or account data to our servers
- It does not read your Instagram password
- It does not modify other websites

Only keep content you have the right to keep.

## Single purpose (Privacy practices tab)

Adds a seek bar to Instagram Reels, posts, and Stories.

## Category

Productivity

## Language

English (add Turkish as a localized listing later if you want)

## Remote code

No, I am not using remote code.

## Data usage checkboxes

Check **Website content** (the extension reads the video element and media URLs already on instagram.com to draw the seek bar and, if you click Keep, to start a local save through Chrome’s downloads UI).

Do **not** check:
- Personally identifiable information
- Health information
- Financial and payment information
- Authentication information
- Personal communications
- Location
- Web history
- User activity

Certify Limited Use: yes. The extension does not sell or transfer user data for ads.

## Privacy policy URL

https://omersengul1.github.io/instagram-better-controls/

## Permission justifications

**storage**
Remembers that the user accepted the first-time keep disclosure so the confirmation is not shown on every click.

**downloads** (optional; requested when the user keeps a video)
Starts Chrome’s Save As dialog for the video file the user asked to keep.

**Host: https://*.cdninstagram.com/*** (optional; requested when the user keeps a video)
Fetches the video file from Instagram’s CDN after a user-initiated Keep. No other hosts.

**Host: https://*.fbcdn.net/*** (optional; requested when the user keeps a video)
Same as above for Facebook CDN URLs used by Instagram video playback.

**Host access to instagram.com** (content script)
Injects the seek bar and keep button only on Instagram pages, and reads the playing video’s position so the bar can update.

## Content rating

Not mature. The extension does not ship adult content; it only adds controls on instagram.com.

## Affiliation disclaimer (keep in description)

Instagram Better Controls is an independent browser extension. It is not affiliated with, endorsed by, or produced by Meta or Instagram.
