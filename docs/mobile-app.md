# The Mobile App

The site installs as an app on phones, and an Android app wraps it. There is no second codebase: both open the live site, so every deploy updates them, and nothing in the app has to be released again unless its frame changes (see "When the APK must be rebuilt").

- **The installable site (PWA):** any phone can add the site to its home screen from the browser ("Install app" in Chrome, "Add to Home Screen" in Safari). It opens full-screen with the emblem as its icon. It is the only way onto an iPhone: an Iranian developer can't publish on the App Store.
- **The Android app (TWA):** a small Android app made with Bubblewrap (`mobile/twa/`) that opens `https://k9training.zurvann.ir` in Chrome, full-screen, with no address bar. On a phone without Chrome it falls back to the system WebView. For now it is shared as a signed APK; Cafe Bazaar and Myket can take the same APK later (they need a developer account in the owner's name).

## The Installable Site

| Piece          | Where                                                                                | What it does                                                                                                                                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Manifest       | `app/routes/pwa_manifest/`, `/pwa/manifest.webmanifest`                              | Name, icons, colours, start address and the long-press shortcuts (courses, free evaluation, my account), in Persian or (`?lang=en`) English. `id` is `/` in both, so it is one app. Linked from the root head (`app/root.tsx`) in the page's language.                                                                   |
| Head tags      | `app/root.tsx`                                                                       | `theme-color`, and iOS's own tags: the title, and a plain `black` status bar (`black-translucent` would draw the page under the clock; the body pads itself by the top inset for the Android app, but that look is untried on an iPhone).                                                                                |
| Icons          | `public/pwa/icon-{192,512,maskable-512}.png`                                         | Made by `node scripts/pwa-icons.mjs [source]` from the gold emblem. The default source is the 256px `public/brand/k9-logo-256.webp`, so 512 is soft: **re-run it with the owner's original emblem when it arrives** (then rebuild the APK).                                                                              |
| Service worker | `public/sw.js`, registered by `app/lib/register-service-worker.ts` (production only) | Only one job: when a page can't load for lack of network, it shows the offline page. It answers nothing else; `/api`, `/rpc`, `/payment` and `/_serverFn` never pass through it.                                                                                                                                         |
| Offline page   | `app/routes/pwa_offline/`, `/pwa/offline` (`?lang=en`)                               | Plain HTML with its CSS inline, precached by the worker with the files it uses (`OFFLINE_FILES` in `sw.js`): the fonts in `public/pwa/fonts/` (copies of the site's, under stable names), the emblem and `public/photo/new-design/offline.webp`. Its look is in [storefront-design.md](storefront-design.md), "Offline". |

Both `/pwa` routes are outside Paraglide's routing (`project.inlang/paraglide.config.ts`): the worker needs one fixed address per language. Their words are in `messages/pwa/` (the name and description are `shared_brand_name` and `shared_contact_descriptor`).

**Changing the offline page, its copy or its files:** bump `OFFLINE_CACHE` in `public/sw.js` (`offline-v1` → `offline-v2`). Browsers fetch the new worker on their next visit, and the new cache name makes them download the page again and drop the old copy. Adding a file the page uses means adding it to `OFFLINE_FILES` too.

### The Install Banner

On a phone, the storefront and the account pages ask to be installed with a banner at the top of the screen, laid out like Chrome's own install popup (the app's icon, «نصب اپ زروان» and the site's address, a gold text «نصب» and ×) on the popover grey (`app/components/install-banner.tsx`, its logic in `app/lib/install-prompt.ts`, its words in `messages/pwa/`). Added on 2026-10-25.

- **Chrome (Android, also Samsung Internet):** Chrome announces that the site can be installed with `beforeinstallprompt`. The event is caught from the first moment the client bundle runs (`captureInstallPrompt` in `app/root.tsx`) and its default is prevented, which keeps Chrome's own mini-infobar away: a phone sees one banner, ours. «نصب» opens Chrome's install dialog.
- **iPhone and iPad:** Safari has no install API, so «نصب» unfolds the two steps of the Share menu, in iOS's own English words (iOS has no Persian interface): Share, then Add to Home Screen.
- **When it comes:** only on a touch screen, 10 seconds into the visit, never in the Admin or on the sign-in page, and not for 30 days after it was closed (×, a swipe up, or cancelling Chrome's dialog). The date is kept in this browser's localStorage (`zurvan-install-dismissed-at`).
- **How it knows the app is installed:** inside the installed app it never shows (the `display-mode` is not the browser's, iOS's `navigator.standalone`, or the TWA's `android-app://` referrer). In Chrome, an installed PWA stops `beforeinstallprompt` from firing at all, so there is nothing to show; `appinstalled` hides the banner the moment it is installed. The Android app is found with `navigator.getInstalledRelatedApps()`, through the manifest's `related_applications` (`ir.zurvann.app`, which declares the site in its `asset_statements`). **Not yet checked on a phone with the APK installed.** Safari can't tell at all: a home-screen app on an iPhone has its own storage, so after "Add to Home Screen" Safari itself may ask again 30 days after the banner was last closed.

## The Android App (TWA)

### What lives where

- `mobile/twa/`: the Bubblewrap project. `twa-manifest.json` is its source (written by hand, not by `bubblewrap init`); the Gradle project around it (`app/`, `build.gradle`, the Gradle wrapper, `store_icon.png`) is generated from it by `bubblewrap update`. Build output and the APKs are gitignored.
- `mobile/twa/signing.env`: **secret, gitignored.** The keystore's path, the key's alias and its password, as `BUBBLEWRAP_KEYSTORE_PASSWORD` and `BUBBLEWRAP_KEY_PASSWORD`, the names `bubblewrap build` reads.
- The keystore: `~/zurvann-keys/zurvann-upload.jks`, outside the repo so deleting or re-cloning it can't lose the key (made 2026-10-24, RSA 2048, valid until 2054). **Back up the keystore and `signing.env` together** (a password manager, or an encrypted USB stick the owner keeps). An app update must be signed with the same key: losing it means every user has to uninstall and reinstall.
- `public/.well-known/assetlinks.json`: the proof that the site and the app belong together (Digital Asset Links), with the key's SHA-256 fingerprint (also kept in `twa-manifest.json`'s `fingerprints`). Without it, or with a wrong fingerprint, the app shows an address bar at the top. **It must stay deployed.**

### The tools

Bubblewrap 1.27 (`npx @bubblewrap/cli@1.27.0`, or a local install) uses its own JDK 17 and Android SDK in `~/.bubblewrap` (`~/.bubblewrap/config.json` names them), and Gradle keeps its downloads in `~/.gradle`. Its first run asks to download them and to accept the Android SDK terms; on 2026-10-24 that took about an hour at ~150 KB/s. Bubblewrap also downloads the JDK's source for license reasons (`~/.bubblewrap/jdk/jdk17u-jdk-17.0.11-9`, ~800 MB unpacked), which nothing uses afterwards. Gradle installs the build tools it needs on the first `build`, and refuses until the SDK licenses are accepted once: `yes | JAVA_HOME=~/.bubblewrap/jdk/jdk-17.0.11+9 ~/.bubblewrap/android_sdk/tools/bin/sdkmanager --sdk_root=$HOME/.bubblewrap/android_sdk --licenses`.

### Building the APK

From `mobile/twa/`:

```bash
set -a && . ./signing.env && set +a
npx @bubblewrap/cli@1.27.0 update --skipVersionUpgrade --manifest=./twa-manifest.json   # only after editing twa-manifest.json
npx @bubblewrap/cli@1.27.0 build --manifest=./twa-manifest.json
```

`build` writes `app-release-signed.apk` (and an `.aab` for the stores). `update` downloads the icons and the web manifest from the URLs in `twa-manifest.json`, so the site must be up. The first APK was built before the manifest was deployed: its icon URLs pointed at a local build, and `--skipPwaValidation` skipped the online quality check; once the site is deployed they point at `https://k9training.zurvann.ir/pwa/…`.

**`update` rewrites `app/src/main/java/ir/zurvann/app/LauncherActivity.java`, and that file has a hand edit.** Check `git diff` after every `update` and put back the `getDisplayMode()` override (see "Full screen" below). Two more traps:

- `update` deletes the icons and splash images before it downloads them again. If it fails halfway (the site is slow), they stay deleted and `build` fails on `drawable/splash`. Restore them with `git checkout -- app/src/main/res store_icon.png`.
- If `build` asks "There are changes in twa-manifest.json", answering yes runs `update`. Write the checksum instead: `printf "%s" "$(sha1sum twa-manifest.json | cut -d' ' -f1)" > manifest-checksum.txt`.

**Full screen.** `display` is `fullscreen-sticky`: the status bar and the navigation buttons hide, and a swipe from the top or bottom edge brings them back over the page for a few seconds. On its own that mode keeps the page out of the camera's strip at the top, leaving an empty band, so `LauncherActivity` overrides `getDisplayMode()` to ask Chrome for the "short edges" cutout mode, which draws the page into that strip too. The site keeps its content out from under the camera with `padding-top: env(safe-area-inset-top)` on the body (`app/app.css`). That inset is 0 everywhere else, in a browser and in the installed PWA. The Admin's sticky header takes that padding into itself (`admin-header.tsx`). Since 1.0.2 (version code 3).

**Keep `enableSiteSettingsShortcut: true` in `twa-manifest.json`.** androidbrowserhelper 2.7.4's launcher turns its "Site settings" activity (`ManageDataLauncherActivity`) on or off on every start, but with the flag off Bubblewrap's template leaves that activity out of the manifest, so the app crashed the moment it opened. MIUI showed nothing at all, not even a crash dialog. The 1.0.0 APK (version code 1) had this bug; 1.0.1 (version code 2) fixed it on 2026-10-24. The only visible effect of the flag is a "Site settings" item in the icon's long-press menu, and only when Chrome supports it.

To print the key's fingerprint again: `~/.bubblewrap/jdk/jdk-17.0.11+9/bin/keytool -list -v -keystore ~/zurvann-keys/zurvann-upload.jks -alias zurvann -storepass "$BUBBLEWRAP_KEYSTORE_PASSWORD" | grep SHA256`. To rewrite `assetlinks.json` from `twa-manifest.json`: `npx @bubblewrap/cli@1.27.0 fingerprint generateAssetLinks --manifest=./twa-manifest.json --output=../../public/.well-known/assetlinks.json`. After a deploy, check that `https://k9training.zurvann.ir/.well-known/assetlinks.json` answers `200` with `application/json` and no redirect (Nitro serves the dot folder from `public/` as is; checked on a local build).

### When the APK must be rebuilt

Only when the app's frame changes: the name, the icons, the colours, the domain or the start address. Bump `appVersionCode` (and `appVersion`) in `twa-manifest.json`, then `update` and `build`, with the same key. Pages, copy, courses and every other change to the site reach the app on the next deploy with no new APK.

### Checking it on a phone

Install the APK (`adb install app-release-signed.apk`, or open the file on the phone). On a Xiaomi phone, `adb install` fails with `INSTALL_FAILED_USER_RESTRICTED` until Developer options → "Install via USB" is on; `adb push` the APK to `/sdcard/Download/` and open it there instead. If the app does nothing when tapped, read the crash with `adb logcat -d | grep -A30 "FATAL EXCEPTION"`; R8 renames the library's classes, and `app/build/outputs/mapping/release/mapping.txt` maps the names back. Then:

- There is no address bar. If there is one, `assetlinks.json` is missing or its fingerprint is not this key's.
- Sign in with an SMS code, add a course to the cart, pay through the gateway, and land back on the cart inside the app. The gateway's page shows a small bar with its address while you are on it: that is expected for another site.
- Phone links open the dialer.
- Airplane mode shows the offline page.
- On a phone without Chrome, the WebView fallback opens.

## Not Yet

- **The APK on the site:** a download link (in the «بیشتر» sheet, say) and a place to host the file. It needs a page decision.
- **Cafe Bazaar and Myket:** a developer account in the owner's name, a store listing (Persian description, screenshots, the 512px icon, the privacy page's address) and their payment rules checked. The center sells real-life training, not digital goods, so the gateway should be allowed, but confirm with each store before submitting.
- **Google Play:** hard for an Iranian developer account. If it ever happens, Play re-signs the app, and its signing fingerprint must be added to `assetlinks.json` beside ours.
