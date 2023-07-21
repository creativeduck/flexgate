import puppeteer from 'puppeteer'
import { Browser } from 'puppeteer'
import { ReviewResult } from './type'

let _browser: Browser | null = null

async function getBrowser() {
  if (!_browser) {
    _browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  return _browser
}

async function resetBrowser() {
  if (_browser) {
    _browser.close()
    _browser = null
  }
}

function getUrl(host: string, goodNum: string, pageNum: number) {
  return `https://${host}/good/product_view_goodrate_list?goodNum=${goodNum}&page=${pageNum}`
}

export async function extract(url: string, lastReviewId?: string) {
  lastReviewId

  const urlObj = new URL(url)
  const host = urlObj.host
  const goodNum = urlObj.searchParams.get('goodNum')
  if (!goodNum) {
    return []
  }
  let pageNum = 1
  let browser = null
  let page = null
  const results = []

  try {
    do {
      browser = await getBrowser()
      page = await browser.newPage()

      await page.goto(getUrl(host, goodNum, pageNum++))

      const reviews = await page.evaluate(() => {
        const childList = Array.from(
          document.querySelectorAll('div.prod-review-item')
        )

        if (childList) {
          return childList.map(review => {
            const reviewId = review?.getAttribute('bbsidx') || ''
            const rate = Number(
              review.querySelector(
                'div.prod-review-rating > div.star-rating-wrap > strong'
              )?.textContent || ''
            )
            const writer =
              review.querySelector('div.prod-review-info > div > div > em')
                ?.textContent || ''
            const date =
              review.querySelector(
                'div.prod-review-info > div > div.prod-review-date > span'
              )?.textContent || ''
            const first =
              review.querySelector(
                'div.prod-review-info > div.prod-review-txt > p'
              )?.textContent || ''
            const second =
              review.querySelector('div.prod-review-detail')?.textContent || ''
            const message = `${first}\n${second}`.trim()
            const images = [
              (
                review.querySelector(
                  'div.review-imgwrap > img'
                ) as HTMLImageElement
              )?.src || '',
            ]
            const optionValue = ''
            const result: ReviewResult = {
              reviewId,
              message,
              writer,
              optionValue,
              date,
              rate,
              images,
            }

            return result
          })
        }
        return []
      })

      if (!reviews.length) {
        break
      }

      const findIndex = reviews.findIndex(
        review => review.reviewId === lastReviewId
      )
      if (findIndex !== -1) {
        results.push(reviews.slice(0, findIndex))
        break
      } else {
        results.push(reviews)
      }
    } while (results.length < 200)

    return results
  } catch (err) {
    if (browser) {
      await resetBrowser()
    }
    console.log(err)
    return []
  } finally {
    if (page) await page.close()
    if (browser) await resetBrowser()
  }
}
