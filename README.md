# Extraordinary Service Cogs — Starter

This is a beginner-friendly starter for a 75-person "collect first, reveal at the end" activity.

## What is already built
- Participant phone upload page
- Phone-side image resizing (max 900px)
- Digital gear masking
- 75 predetermined screen positions
- Alternating clockwise/counterclockwise spinning
- One-click BUILD OUR MACHINE reveal
- One-click final message
- Demo Mode so you can test before Supabase is connected

## FIRST TEST — no accounts required
1. Download/unzip this folder.
2. The easiest proper test is after uploading it to GitHub Pages, because browsers may block some local file behavior.
3. Open `display.html`.
4. Click **Load Demo Cogs**.
5. Click **BUILD OUR MACHINE**.
6. Click **Final Message**.

## When you are ready to connect Supabase
1. Create a Supabase project.
2. Create a Storage bucket named `cogs`. Make it public for this starter configuration.
3. Open Supabase SQL Editor and run `supabase-setup.sql`.
4. In Supabase Project Settings/API, copy your project URL and browser-safe anon/publishable key.
5. Open `config.js`.
6. Replace the two placeholder values.
7. Change `DEMO_MODE: true` to `DEMO_MODE: false`.
8. Upload/commit the updated file to GitHub.

NEVER put a Supabase service-role/secret administrator key in `config.js`.

## Important reliability choices
- Submitted phone images are reduced before upload.
- No live reveal is required during the 20-minute presentation.
- At the end, the presenter page reads the finished submission list.
- Click Refresh Count immediately before the reveal.
- Then click BUILD OUR MACHINE.
- The layout supports up to 75 submitted cogs.

## Before the real event
Test the real QR/upload flow from:
- an iPhone
- an Android phone if possible
- cellular data
- the venue Wi-Fi

Also keep a static closing slide as an emergency fallback.
