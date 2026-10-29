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
  // Dismiss the first-run "CREATE YOUR RAT" modal if present.
  const go = page.locator('#createGo');
  if (await go.isVisible().catch(() => false)) await go.click();
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
});

test.describe('Maze game', () => {
  test('opens and shows score', async ({ page }) => {
    await page.keyboard.press('m');
    await expect(page.locator('#gameOverlay')).toHaveClass(/show/);
    await expect(page.locator('#gameFoot')).toContainText('SCORE');
  });
});
