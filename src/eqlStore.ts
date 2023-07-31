import axios from 'axios'
import { ReviewResult } from './type'
import { getCodeByPath } from './util'
import { load } from 'cheerio'

const defaultResultSize = 200

async function getReview(productCode: string) {
  const baseUrl = 'https://review3.cre.ma/eqlstore.com/products/reviews'
  const paramsObj = {
    product_code: productCode,
    sort: `20`,
  }
  const params = new URLSearchParams(paramsObj).toString()
  const { data } = await axios.get(`${baseUrl}?${params}`)
  const $ = load(data)

  return $('ul.products_reviews__reviews')
    .children()
    .toArray()
    .map(review => {
      const reviewId = review.attribs.id
      const message = $(review)
        .find('div.review_list_v2__message')
        .text()
        .trim()
      const writer = $(review)
        .find('div.review_list_v2__user_name_message > b')
        .text()
      const date = $(review).find('div.review_list_v2__date').text()
      const rate = Number(
        $(review)
          .find('div.review_list_v2__score_star > span')
          .text()
          .split(':')[1]
          .split('점')[0]
      )
      const optionValue = $(review)
        .find('div.review_options_v2__option')
        .toArray()
        .map(option => {
          return $(option)
            .children()
            .toArray()
            .map(op => $(op).text())
            .join(' : ')
        })

      const images = $(review)
        .find('ul.review_media_v2__media')
        .children()
        .toArray()
        .map(li => {
          const img = $(li)
            .find('img.review_media_v2__medium_image')
            .attr('src')

          return img ? `https:${img}` : ''
        })
        .filter(img => img.length > 0)

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
}

export async function extract(url: string, lastReviewId?: string) {
  const results: ReviewResult[] = []
  const productCode = getCodeByPath(url, 'product')
  if (!productCode) {
    return results
  }

  do {
    const reviews = await getReview(productCode)
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
