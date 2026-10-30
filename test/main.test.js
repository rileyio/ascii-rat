/**
 * ASCII Rat - Core Functionality Tests
 *
 * Notes for maintainers:
 * - The app uses top-level `let`/`const` bindings in classic scripts, so
 *   nothing is exposed on `window`; readiness is detected via the rendered
 *   ASCII screen, and tab navigation goes through the app's own functions.
 * - Avoid page.waitForTimeout(); use expect.poll() or locator auto-waiting.
 * - SETTINGS TABS: with a narrow modal, the last tabs (SHARE, ABOUT,
 *   PERFORMANCE) are display:none in the tab bar and only reachable through
 *   the overflow dropdown, whose automated clicks are unreliable. Tests
 *   therefore switch tabs via the app's own `curTab` binding + renderSettings().
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

const BASE_URL = `file://${path.join(__dirname, '..')}/index.html`;

/** Wait until the app has booted and painted its first frame. */
async function waitReady(page) {
  await page.goto(BASE_URL);
  await page.waitForFunction(() => {
    const pre = document.getElementById('screen');
    return !!pre && pre.textContent.length > 0;
  }, null, { timeout: 15000 });
  // Dismiss the first-run "CREATE YOUR RAT" modal if it is actually open.
  // On repeat visits (setupDone persisted) the overlay is closed with
  // pointer-events: none, but its buttons still report as visible, so a
  // blind click would hang on the hit-target check.
  const overlayShown = await page
    .evaluate(() => document.getElementById('createOverlay').classList.contains('show'))
    .catch(() => false);
  if (overlayShown) await page.locator('#createGo').click();
}

/** Open settings and switch to a tab via the app's own functions. */
async function openSettingsTab(page, tab) {
  // 's' TOGGLES settings; close it first so a second call re-opens instead
  // of silently closing the overlay.
  await page.evaluate(() => closeSettings());
  await page.keyboard.press('s');
  await expect(page.locator('#setOverlay')).toHaveClass(/show/);
  await page.evaluate((t) => { curTab = t; renderSettings(); }, tab);
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => { pageErrors.push(String(err)); });
  await waitReady(page);
});

let pageErrors = [];

test.describe('Main page', () => {
  test('renders hint bar with help hint', async ({ page }) => {
    await expect(page.locator('.hint')).toContainText('?');
  });

  test('no console/page errors during idle render', async ({ page }) => {
    await expect.poll(() => pageErrors.length).toBe(0);
  });
});

test.describe('Settings', () => {
  test('STYLE tab shows RAT COMPOSITION + render mode + resolution', async ({ page }) => {
    await openSettingsTab(page, 'STYLE');
    await expect(page.locator('#setPanels')).toContainText('RAT COMPOSITION');
    await expect(page.locator('#setPanels')).toContainText('RENDER RESOLUTION');
    await expect(page.locator('#setPanels button', { hasText: 'POLYGON' }).first()).toBeAttached();
    await expect(page.locator('#setPanels button', { hasText: 'POINTS' }).first()).toBeAttached();
  });

  test('switching to POLYGON mode keeps rendering', async ({ page }) => {
    await openSettingsTab(page, 'STYLE');
    await page.locator('#setPanels button', { hasText: 'POLYGON' }).first().click();
    await expect.poll(() => page.evaluate(() => state.renderMode)).toBe('POLYGON');
    await expect
      .poll(async () => page.evaluate(() => document.getElementById('screen').textContent.length))
      .toBeGreaterThan(0);
    await expect.poll(() => pageErrors.length).toBe(0);
  });

  test('changing resolution reallocates without errors', async ({ page }) => {
    await page.evaluate(() => setResolution(1.5));
    await expect
      .poll(async () => page.evaluate(() => document.getElementById('screen').textContent.length))
      .toBeGreaterThan(0);
    await expect.poll(() => pageErrors.length).toBe(0);
  });

  test('RAT tab has share + ABOUT tab has diagnostics', async ({ page }) => {
    await openSettingsTab(page, 'RAT');
    await expect(
      page.locator('#setPanels button', { hasText: 'SHARE SETUP' })
    ).toBeAttached();
    await openSettingsTab(page, 'ABOUT');
    await expect(page.locator('#setPanels')).toContainText('DIAGNOSTICS');
  });

  // Regression: the Halloween pumpkin-head branch only built the shaded point
  // cloud (pts), never the wireframe mesh (mpts/medges), so in POLYGON mode
  // the rat rendered headless. The pumpkin branch must contribute mesh
  // geometry, and the carved face must actually paint on screen.
  test('halloween pumpkin head renders in POLYGON mode', async ({ page }) => {
    // isOctober is computed at page load; pin the clock to October so the
    // test works in any month. waitReady's goto re-navigates, so the
    // pinned date is in effect when the app scripts load.
    await page.clock.setFixedTime(new Date('2026-10-15T12:00:00'));
    await waitReady(page);

    // Enable Halloween mode the same way the settings toggle does.
    await page.evaluate(() => {
      state.halloween = true;
      applyHalloween();
      buildRat(state.rat);
      saveState();
    });

    // The pumpkin branch must contribute wireframe geometry, not just the
    // face loops. Carved-face mesh points exist only in the pumpkin branch,
    // and once halloween is on, the only non-carve mesh beyond the body's
    // front extent (x > headX) is the ridged pumpkin surface + stem - legs,
    // tail and body all stay behind bodyRx < headX.
    await expect
      .poll(() => page.evaluate(() => mpts.filter((p) => p.carve).length))
      .toBeGreaterThan(0);
    await expect
      .poll(() => page.evaluate(() => {
        const hx = 1.55 * state.rat.bodyLen + 0.35 * state.rat.headSize;
        return mpts.filter((p) => p.x > hx && !p.carve).length;
      }))
      .toBeGreaterThan(0);

    // Switch to POLYGON through the settings UI...
    await openSettingsTab(page, 'STYLE');
    await page.locator('#setPanels button', { hasText: 'POLYGON' }).first().click();
    await expect.poll(() => page.evaluate(() => state.renderMode)).toBe('POLYGON');
    // ...then close settings: the main screen only repaints while the
    // settings overlay is closed, so carve spans can never appear on a
    // frozen frame.
    await page.keyboard.press('s');
    await expect(page.locator('#setOverlay')).not.toHaveClass(/show/);

    // Confirm the carved face actually paints with its negative-color
    // span treatment on the live POLYGON-mode screen.
    await expect
      .poll(() => page.evaluate(() => document.querySelectorAll('#screen .carve').length))
      .toBeGreaterThan(0);
    await expect.poll(() => pageErrors.length).toBe(0);
  });
});

test.describe('Maze game', () => {
  test('opens and shows score', async ({ page }) => {
    await page.keyboard.press('m');
    await expect(page.locator('#gameOverlay')).toHaveClass(/show/);
    await expect(page.locator('#gameFoot')).toContainText('SCORE');
  });
});

test.describe('Mobile viewport', () => {
  // Regression: a @media (max-width: 767px) rule used to force
  // `.overlay { pointer-events: auto }`, so closed (opacity: 0) overlays
  // still covered the screen and swallowed every click.
  test.use({ viewport: { width: 400, height: 800 } });

  test('closed overlays do not block pointer events', async ({ page }) => {
    // No invisible overlay may sit on top of the page.
    const hitAnOverlay = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      return !!el && !!el.closest('.overlay');
    });
    expect(hitAnOverlay).toBe(false);

    // A real click must reach the stage.
    await page.locator('#screen').click();

    // Settings must still open and close at this width.
    await page.keyboard.press('s');
    await expect(page.locator('#setOverlay')).toHaveClass(/show/);
    await page.keyboard.press('s');
    await expect(page.locator('#setOverlay')).not.toHaveClass(/show/);

    // And the page is interactive again afterwards.
    await page.locator('#screen').click();
  });
});
