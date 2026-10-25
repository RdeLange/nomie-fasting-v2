import { chromium } from '/Users/ronalddelange/Library/Mobile Documents/com~apple~CloudDocs/DailyNomie/Development/dailynomie7/node_modules/playwright/index.mjs'
const store = { active: { name: '16:8 intermittent', description: '', hours: 16, color: '#90BAEE', startedAt: new Date(Date.now() - 5 * 3600_000).toISOString() } }
const fake = `window.NomiePlugin = class { constructor(d){ this.hooks = {}; window.__plugin = this; this.prefs = { theme: 'dark', fontScale: 1 }; this.store = ${JSON.stringify(store)}; this.storage = { init: async () => {}, getItem: (k) => this.store[k], setItem: async (k, v) => { this.store[k] = JSON.parse(JSON.stringify(v)) } } } onRegistered(f){ (this.hooks.onRegistered ||= []).push(f) } onUIOpened(f){ (this.hooks.onUIOpened ||= []).push(f) } onWidget(f){ (this.hooks.onWidget ||= []).push(f) } }`
const browser = await chromium.launch()
for (const [w, h, name] of [[170, 170, 'small'], [360, 170, 'medium'], [360, 360, 'large']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await page.route('**/cdn.jsdelivr.net/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }))
  await page.addInitScript(fake)
  await page.goto('http://localhost:5103/', { waitUntil: 'load' })
  await page.waitForTimeout(400)
  await page.evaluate(() => window.__plugin.hooks.onWidget.forEach((f) => f()))
  await page.waitForTimeout(1200)
  await page.screenshot({ path: process.env.SHOTS + '/tl-' + name + '.png' })
  await page.close()
}
await browser.close()
