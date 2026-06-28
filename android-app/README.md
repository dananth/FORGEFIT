# FORGEFIT Android Wrapper

This folder contains a native Android WebView app for FORGEFIT.

## What this supports

- Local wrapper mode: loads the repo's `index.html` from app assets.
- Hosted wrapper mode: loads a remote URL (GitHub Pages or Replit deployment).

## Project structure

- `android-app/app/src/main/java/com/forgefit/app/MainActivity.kt`: WebView host activity
- `android-app/app/build.gradle.kts`: Android config + web asset sync task
- `android-app/app/src/main/assets/www/index.html`: built from repo root `index.html`

## How local mode works

On every build, Gradle copies `../../index.html` into `app/src/main/assets/www/index.html`.

MainActivity then loads:

- `file:///android_asset/www/index.html` if `WEB_APP_URL` is empty

## How hosted mode works (GitHub Pages/Replit)

In `android-app/gradle.properties`, set:

```properties
WEB_APP_URL=https://your-hosted-url
```

MainActivity will load that URL instead of local assets.

## Build and run

1. Open `android-app` in Android Studio.
2. Let Gradle sync.
3. Run on emulator/device.

## Downloadable APK via GitHub Actions

This repo includes an automated APK build workflow at:

- `.github/workflows/build-android-apk.yml`

To generate a downloadable APK:

1. Push your code to GitHub.
2. Open the repository Actions tab.
3. Run `Build Android APK` (or wait for it to run on push to `main`).
4. Open the workflow run and download the `forgefit-debug-apk` artifact.

The artifact contains:

- `app-debug.apk`

## Important note about Claude API calls

Your current `index.html` uses browser-side calls to Anthropic intended for the Claude artifact runtime. In a normal Android WebView or hosted web app, that runtime auth is not present.

To make AI features work in production, move Anthropic calls to a backend endpoint and call that endpoint from the app.
