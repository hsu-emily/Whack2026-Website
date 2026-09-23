import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 900, height: 1200 })
await page.goto('http://localhost:5183/#faq', { waitUntil: 'networkidle' })
await page.locator('#faq').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)

const data = await page.evaluate(() => {
  const faq = document.querySelector('.waves-faq').getBoundingClientRect()
  const art = document.querySelector('.waves-art').getBoundingClientRect()
  const scrim = document.querySelector('.waves-scrim').getBoundingClientRect()
  const list = document.querySelector('.waves-list').getBoundingClientRect()
  const faqCS = getComputedStyle(document.querySelector('.waves-faq'))
  const listCS = getComputedStyle(document.querySelector('.waves-list'))
  const artInline = document.querySelector('.waves-art').getAttribute('style')
  return {
    faq: { top: faq.top, bottom: faq.bottom, height: faq.height },
    art: { top: art.top, bottom: art.bottom, height: art.height },
    scrim: { top: scrim.top, bottom: scrim.bottom, height: scrim.height },
    list: { top: list.top, bottom: list.bottom, height: list.height },
    faqDisplay: faqCS.display,
    faqGridTemplateRows: faqCS.gridTemplateRows,
    listPosition: listCS.position,
    listTopProp: listCS.top,
    listTransform: listCS.transform,
    artInlineStyle: artInline,
  }
})
console.log(JSON.stringify(data, null, 2))

const artMid = (data.art.top + data.art.bottom) / 2
const listMid = (data.list.top + data.list.bottom) / 2
console.log('art midpoint:', artMid, ' list midpoint:', listMid, ' diff:', (listMid - artMid).toFixed(1))
console.log('faq midpoint:', (data.faq.top + data.faq.bottom)/2, ' vs list midpoint:', listMid)

await browser.close()
