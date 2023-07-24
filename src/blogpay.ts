import axios from 'axios'
import { load } from 'cheerio'
import { ReviewResult } from './type'

function getUrl(host: string, goodNum: string, pageNum: number) {
  return `https://${host}/good/product_view_goodrate_list?goodNum=${goodNum}&page=${pageNum}`
}

export async function extract(url: string, lastReviewId?: string) {
  const results: ReviewResult[] = []
  const urlObj = new URL(url)
  const host = urlObj.host
  const goodNum = urlObj.searchParams.get('goodNum')
  if (!goodNum) {
    return results
  }
  let pageNum = 1

  do {
    const { data } = await axios.get<string>(getUrl(host, goodNum, pageNum++))
    const $ = load(data)
    const childList = $('div.prod-review-item').toArray()

    const reviews = childList.map(review => {
      const reviewId = review.attribs.bbsidx
      const rate = Number(
        $(review)
          .find('div.prod-review-rating > div.star-rating-wrap > strong')
          .text()
      )
      const writer = $(review)
        .find('div.prod-review-info > div > div > em')
        .text()
      const date = $(review)
        .find('div.prod-review-info > div > div.prod-review-date > span')
        .text()
      const firstContent = $(review)
        .find('div.prod-review-info > div.prod-review-txt > p')
        .text()
        .trim()
      const secondContent = $(review)
        .find('div.prod-review-detail')
        .text()
        .trim()
      const message = `${firstContent}\n${secondContent}`
      const images = [...$(review).find('div.review-imgwrap > img')].map(
        img => `https://${host}${img.attribs['src']}`
      )
      const optionValue = ''

      return {
        reviewId,
        message,
        writer,
        optionValue,
        date,
        rate,
        images,
      }
    })

    if (!reviews.length) {
      break
    }

    const findIndex = reviews.findIndex(
      review => review.reviewId === lastReviewId
    )
    if (findIndex !== -1) {
      results.push(...reviews.slice(0, findIndex))
      break
    }
    results.push(...reviews)
  } while (results.length < 200)

  return results
}
