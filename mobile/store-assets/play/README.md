# Google Play Store Assets

This folder contains Play Console listing assets for Fitness PT Tracker.

The screenshots and feature graphic are generated from the stock fitness photos
used by the web and native app. Regenerate them with:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File mobile/scripts/generate-stock-store-assets.ps1
```

## Files

- `icon-512.png` - 512x512 Play Store app icon.
- `feature-graphic-1024x500.png` - 1024x500 Play feature graphic.
- `01-login.png` - phone screenshot for sign-in and daily overview.
- `02-trainer-dashboard.png` - phone screenshot for trainer dashboard workflows.
- `03-appointments.png` - phone screenshot for appointment actions.
- `04-progress.png` - phone screenshot for progress tracking.

## Play Console Mapping

- Store listing icon: `icon-512.png`
- Feature graphic: `feature-graphic-1024x500.png`
- Phone screenshots: `01-login.png` through `04-progress.png`