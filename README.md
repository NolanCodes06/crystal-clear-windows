# Crystal Clear Window Washing

Website for Crystal Clear Window Washing, an owner-operated window and power washing business in San Antonio, TX.

**Live site:** https://ccwc.solutions

## What's on it

- Posted prices and an instant quote builder (window sizes, add-ons, plans, discounts, travel by ZIP)
- Booking through Calendly, with the quote filled in automatically
- Quotes emailed to the owner through FormSubmit
- A links page for QR codes and social bios: `/#links`
- Owner tools behind a passcode: `/#admin` (quote desk, pricing editor, business cards, door hangers, QR code, photo prompts, setup guide)

It's one static `index.html` with no server and no database. GitHub Pages hosts it for free.

## Changing prices, links or contact info

Easiest way: open `index.html` on GitHub, click the pencil icon, find `SITE SETTINGS START`, change the values, and commit. The live site updates in about a minute.

You can also use `/#admin` > Pricing & settings to try changes on your own device first. It gives you a settings block to paste in.

If you edit the files in `src/` instead, run `python3 build.py` to rebuild `index.html`, then commit both.

## Photos

Put photos in the `images/` folder using the file names listed in `images/README.md`. Any photo that's missing is just skipped.

## Folder layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole site, built and ready to serve |
| `src/` | Source pieces: page markup, styles, settings, quote engine, owner tools |
| `build/` | Data the build drops in: ZIP code map, CWT logo shape, brush stroke |
| `build.py` | Rebuilds `index.html` from `src/` and `build/` |
| `images/` | Website photos |
