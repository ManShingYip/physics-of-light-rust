import { chromium } from 'playwright-core'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const out = process.argv[2] ?? path.join(here, '..', 'shot.png')
const url = process.argv[3] ?? 'https://manshingyip.github.io/physics-of-light-rust/'
const waitMs = Number.parseInt(process.argv[4] ?? '9000', 10)
const scene = process.argv[5] ?? ''
const js = process.argv[6] ?? ''

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: [
    '--no-sandbox',
    '--enable-unsafe-webgpu',
    '--use-vulkan=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.on('console', (m) => console.log('[console]', m.type(), m.text()))
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.goto(url, { waitUntil: 'load', timeout: 60000 })
if (scene !== '' && scene !== 'none') {
  await page.waitForSelector('#sceneSel', { timeout: 15000 })
  await page.selectOption('#sceneSel', scene)
}
await page.waitForTimeout(waitMs)
if (js !== '' && js !== 'none') {
  await page.evaluate(js)
  await page.waitForTimeout(Number(process.env.SHOT_POST ?? 4000))
}
await page.screenshot({ path: out })
await browser.close()
console.log('shot saved', out)

