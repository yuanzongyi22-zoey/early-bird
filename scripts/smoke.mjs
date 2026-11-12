// Use an installed Playwright, or set PLAYWRIGHT_MODULE to its absolute module path.
// No persistent browser profile is used. All mutations affect this isolated context only.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const root = fileURLToPath(new URL('../out/', import.meta.url))
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.txt': 'text/plain' }
let server
let base = process.env.SMOKE_URL
if (!base) {
  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost')
      if (!url.pathname.startsWith('/early-bird/')) { res.writeHead(404).end(); return }
      let relative = decodeURIComponent(url.pathname.slice('/early-bird/'.length))
      if (!relative || relative.endsWith('/')) relative += 'index.html'
      const file = path.resolve(root, relative)
      if (!file.startsWith(root)) { res.writeHead(403).end(); return }
      const data = await readFile(file)
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(data)
    } catch { res.writeHead(404).end() }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}/early-bird/`
}
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 } })
  const page = await context.newPage()
  const errors = []
  const failed = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('requestfailed', request => failed.push(`${request.failure()?.errorText} ${request.url()}`))
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`) })
  const response = await page.goto(base, { waitUntil: 'networkidle' })
  assert.equal(response.status(), 200)
  assert.match(await page.title(), /早早鸟/)
  const click = async name => {
    await page.getByRole('button', { name, exact: true }).click()
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))
  }
  const board = async name => {
    await page.locator(`[data-board="${name}"]`).waitFor()
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0))
  }
  await board('welcome')
  await click('开启早鸟演示'); await board('login'); await click('登录'); await board('home')
  await click('预定'); await board('menu')
  await click('增加玉米粥')
  assert.match(await page.getByLabel('总计').textContent(), /3.00/)
  await click('下一步'); await board('checkout')
  await click('修改配送地点')
  await page.getByLabel('取餐点').selectOption('图书馆 · 一层取餐点')
  await click('保存'); await click('结算'); await board('pickup')
  await click('模拟取餐完成'); await board('review'); await click('评价本次早餐')
  await page.getByRole('radio', { name: '4星' }).check()
  await page.getByLabel('用餐评价').fill('浏览器冒烟：早餐热乎')
  await click('提交评价')
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('early-bird-demo-v1')))
  let data = await stored()
  assert.equal(data.orders.length, 1)
  assert.equal(data.orders[0].review.stars, 4)
  assert.equal(data.orders[0].done, true)
  await page.reload({ waitUntil: 'networkidle' }); await board('home')
  await click('早餐进度')
  await page.getByText('浏览器冒烟：早餐热乎', { exact: true }).waitFor()
  await click('返回首页'); await click('社区'); await click('组队详情')
  await click('今日打卡')
  assert.equal(await page.getByRole('button', { name: '今日已打卡', exact: true }).isDisabled(), true)
  await click('返回'); await click('我的'); await click('个人资料')
  await click('增加400ml'); await click('增加200ml')
  await click('修改体重'); await page.getByLabel('体重（kg）').fill('55.5'); await click('保存今日体重')
  data = await stored()
  assert.equal(Object.values(data.water)[0], 600)
  assert.equal(data.weights[0].value, 55.5)
  await click('返回'); await click('首页')
  for (const [width, height] of [[1440, 1000], [1200, 700], [430, 932], [320, 568]]) {
    await page.setViewportSize({ width, height })
    await page.waitForFunction(() => {
      const bounds = document.querySelector('[data-board="home"]')?.getBoundingClientRect()
      return bounds && bounds.left >= -1 && bounds.top >= -1 && bounds.right <= innerWidth + 1 && bounds.bottom <= innerHeight + 1
    })
    await click('预定'); await board('menu'); await click('返回'); await board('home')
  }
  const assets = (await readdir(fileURLToPath(new URL('../public/early-bird/', import.meta.url)))).filter(name => name.endsWith('.png'))
  assert.equal(assets.length, 24)
  for (const name of assets) {
    const assetResponse = await context.request.get(`${base}early-bird/${encodeURIComponent(name)}`)
    assert.equal(assetResponse.status(), 200, name)
    assert.match(assetResponse.headers()['content-type'], /image\/png/, name)
  }
  const resources = await page.evaluate(() => [...document.querySelectorAll('script[src],link[rel="stylesheet"]')].map(el => el.src || el.href))
  assert(resources.some(url => url.endsWith('.js')))
  assert(resources.some(url => url.endsWith('.css')))
  for (const url of resources) assert.equal((await context.request.get(url)).status(), 200, url)
  assert.deepEqual(errors, [])
  assert.deepEqual(failed, [])
  console.log(JSON.stringify({ url: base, chrome: browser.version(), pngAssets: assets.length, scriptsAndStyles: resources.length, orderReviewReload: 'passed', checkinHealth: 'passed', viewportSizes: 4, pageErrors: errors, failedRequests: failed }, null, 2))
  await context.close()
} finally {
  await browser.close()
  if (server) await new Promise(resolve => server.close(resolve))
}
