import axios from 'axios'
import { load } from 'cheerio'
import { ReviewResult } from './type'

const defaultResultSize = 5

async function getReview(id: string, page: number) {
  const reviews: ReviewResult[] = []
  const baseUrl = `https://www.10x10.co.kr/shopping/act_itemEvaluate.asp?itemid=${id}&sortMtd=ne&page=${page}`
  const { data } = await axios.get(baseUrl)
  const $ = load(data)
  const reviewList = $('table.talkList > tbody').children()

  for (let i = 0; i < reviewList.length; i += 2) {
    const first = reviewList[i]
    const writer = $(first).find('td:nth-child(4)').text()
    const date = $(first).find('td:nth-child(3)').text()
    const reviewId = `${date}-${writer}`
    const rate = Number(
      $(first)
        .find('td > img')
        .attr('alt')
        ?.replace(/[^0-9]/gi, '')
    )

    const second = reviewList[i + 1]
    const message = $(second)
      .find('div.customerReview > div > div.textArea > p')
      .text()
    const images = $(second)
      .find('div.customerReview > div > div.imgArea')
      .toArray()
      .map(imgArea => $(imgArea).find('img').attr('src') || '')
      .filter(img => img.length > 0)

    const optionValue = $(second)
      .find('div.customerReview > div > div.purchaseOption > em')
      .text()
      .split(',')

    reviews.push({
      reviewId,
      message,
      writer,
      optionValue,
      date,
      rate,
      images,
    })
  }

  return reviews
}

export async function extract(url: string, lastReviewId?: string) {
  const results: ReviewResult[] = []
  const urlObj = new URL(url)
  const itemId = urlObj.searchParams.get('itemid')
  if (!itemId) {
    return results
  }
  let page = 1

  do {
    const reviews = await getReview(itemId, page++)

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
  } while (results.length < defaultResultSize)

  return results
}
