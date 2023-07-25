import axios from 'axios'
import { ReviewResult } from './type'

const defaultResultSize = 200

async function getReview(isDealId: boolean, id: number, page: number) {
  const baseUrl = `https://ohou.se/production_reviews.json?${
    isDealId ? 'deal_id' : 'production_id'
  }=${id}&page=${page}&order=recent`

  const { data } = await axios.get<{
    average_all: number
    count: number
    reviews: {
      card: {
        image_url: string
      }
      created_at: string
      id: string
      production_information: {
        explain: string
        name: string
      }
      review: {
        comment: string
        star_avg: number
      }
      writer_id: number
      writer_nickname: string
    }[]
  }>(baseUrl)

  return data
}

function maskingName(name: string) {
  if (name.length <= 2) {
    return name.replace(/.$/, '*')
  } else {
    const strArr = name
      .split('')
      .map((str, index) => {
        if (index === 0 || index === name.length - 1) {
          return str
        }
        return '*'
      })
      .join()
      .replace(/,/gi, '')

    return strArr
  }
}

function getProductNo(url: string) {
  const urlObj = new URL(url)
  const urls = urlObj.pathname.split('/')
  let index = 0

  while (index < urls.length) {
    if (urls[index++] === 'productions') {
      break
    }
  }

  if (index === urls.length) {
    return -1
  }
  return Number(urls[index])
}

export async function extract(url: string, lastReviewId?: string) {
  const results: ReviewResult[] = []
  const productNo = getProductNo(url)
  if (productNo === -1) {
    return results
  }
  let page = 1
  let isDealId = true

  const data = await getReview(isDealId, productNo, page++)
  if (data.reviews.length === 0) {
    isDealId = false
  }

  do {
    const data = await getReview(isDealId, productNo, page++)
    const reviews = data.reviews.map(review => {
      const reviewId = review.id
      const writer = maskingName(review.writer_nickname)
      const optionValue = [review.production_information.name]
      const explain = review.production_information.explain
      if (explain.length > 0) {
        optionValue.push(explain)
      }

      const date = review.created_at
      const rate = review.review.star_avg
      const message = review.review.comment
      const images = review.card.image_url

      return {
        reviewId,
        writer,
        optionValue,
        date,
        rate,
        message,
        images: images.length > 0 ? [images] : [],
      }
    })

    if (!reviews.length) {
      break
    }

    const findIndex = reviews.findIndex(
      review => review.reviewId.toString() === lastReviewId
    )

    if (findIndex !== -1) {
      results.push(...reviews.slice(0, findIndex))
      break
    }
    results.push(...reviews)
  } while (results.length < defaultResultSize)

  return results
}
