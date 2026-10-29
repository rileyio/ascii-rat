# Tests

Playwright smoke tests for the app's core functionality.

## Run

```bash
npm test          # all tests (~4s)
npm run test:ui   # interactive UI mode
```

## Gotchas (read before writing tests)

- **Nothing is exposed on `window`.** The app's globals (`state`, `curTab`,
  `setResolution`, `renderSettings`, ...) are top-level `let`/`function`
  declarations in classic scripts — global *lexical* bindings, invisible as
  `window.x`. Readiness is detected via `#screen` content; tab navigation and
  app functions work inside `page.evaluate`.
- **`s` toggles settings.** Call `closeSettings()` before opening again.
- **Settings tabs can be display:none.** With a narrow modal, the last tabs
  (SHARE, ABOUT, PERFORMANCE) live behind the overflow dropdown, whose
  automated clicks are unreliable. Tests navigate via
  `curTab` + `renderSettings()` in `evaluate`.
- The first-run "CREATE YOUR RAT" modal is dismissed in `beforeEach`.
- Avoid `page.waitForTimeout`; use `expect.poll` and locator auto-waiting.

## Coverage

| Describe | Tests | What |
|----------|-------|------|
| Main page | 2 | hint bar, error-free idle render |
| Settings | 4 | STYLE (composition/mode/resolution), POLYGON render, resolution realloc, RAT share + ABOUT diagnostics |
| Maze game | 1 | opens, shows score |

The uncaught page-error collector in `beforeEach` catches render-loop
breakage (e.g. the "Assignment to constant variable" regression from the
v6.1.0 merge).

## Config

`playwright.config.js` lives at the repo root — Playwright ignores configs
in subdirectories (the old suite's config sat unused in `test/`, which is
part of why it never ran properly).
