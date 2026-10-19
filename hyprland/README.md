# ASCII Rat — Hyprland Bar Widget (DankMaterialShell plugin)

A bar widget for DankMaterialShell (DMS) on Hyprland. A pixel rat SVG sits in
the bar; clicking it spawns a browser window running the actual ASCII Rat page
(`index.html` from this repo) — a 1:1 port by construction, since it *is* the
real app. When launched through the widget, the page first plays a short pixel
welcome intro (`?welcome=1`), then fades into the familiar ASCII Rat with its
own MATERIALIZE entrance replaying.

## What's here

- `plugin.json` — DMS plugin manifest
- `AsciiRatWidget.qml` — bar pill: pixel rat icon, click launches the window
- `AsciiRatSettings.qml` — settings: browser command, repo path, intro toggle
- `icons/rat.svg` — pixel rat bar icon (uses `currentColor`, follows theme)
- `../js/intro.js` — welcome intro overlay, active only with `?welcome=1`
- `../index.html` — one added line: the `intro.js` script tag (nothing else)

## The intro sequence

1. Window appears (browser or WebEngine view)
2. Pixelated dot-pattern **WELCOME** materializes with a slight zoom
3. A pixel moon slides in behind the text with a light transition/glow
4. After ~3.5s everything fades out and the ASCII rat renders in
   (its existing entrance animation replays via `entranceT`)

`intro.js` is fully self-contained: it injects its own CSS, builds its own
overlay, removes itself afterwards, and does nothing on a normal page load.

## Install

Copy this `hyprland/` folder into your DMS plugins directory and reload:

```sh
cp -r hyprland ~/.config/quickshell/dms/plugins/asciiRat
```

In the plugin settings, set **repo path** to your ascii-rat checkout and the
**browser command** to your browser of choice.

## Optional: make the window materialize on the Hyprland side

Add a Hyprland window rule so the spawned window floats, centered, with a
pop-in animation (e.g. in `hyprland.lua`):

```lua
windowrule = {
  float = true,
  center = true,
  animation = "popin 80",
  match = { class = "firefox", title = "ASCII Rat" },
}
```

(Adjust `class`/title to your browser and the page `<title>` — "ASCII Rat".)

## Notes

- The plugin's own `version: 1.0.0` in `plugin.json` is the widget's version,
  not an ASCII Rat app/save-format version. No app version strings are touched.
- The QML follows the DMS plugin format; depending on your installed DMS
  version, pill click wiring (`MouseArea`) or setting widgets may need small
  API adjustments.
- This lives on the `hyprland-widget` branch only. `main` and `dev` are
  untouched.
