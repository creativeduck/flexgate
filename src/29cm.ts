import axios from 'axios'
import { ReviewResult } from './type'

const defaultSize = 20
const defaultResultSize = 200

async function getReview(itemId: string, page: number, size = defaultSize) {
  const baseUrl = `https://review-api.29cm.co.kr/api/v4/reviews?itemId=${itemId}&page=${page}&size=${size}`
  const { data } = await axios.get<{
    data: {
      results: {
        itemReviewNo: string
        optionValue: string[]
        userId: string
        point: number
        contents: string
        uploadFiles: {
          filename: string
          contentType: string
          url: string
        }[]
        insertTimestamp: string
      }[]
    }
  }>(baseUrl)

  return data.data.results
}

export async function extract(url: string, lastReviewId?: string) {
  const urlObj = new URL(url)
  const urls = urlObj.pathname.split('/')
  const itemId = urls[urls.length - 1]
  let page = 0
  const results: ReviewResult[] = []

  do {
    const data = await getReview(itemId, page++)
    const reviews: ReviewResult[] = data.map(review => {
      const reviewId = review.itemReviewNo
      const writer = review.userId
      const optionValue = review.optionValue
      const date = review.insertTimestamp
      const rate = review.point
      const message = review.contents
      const images = review.uploadFiles.map(
        img => `https://img.29cm.co.kr${img.url}`
      )

      return {
        reviewId,
        writer,
        optionValue,
        date,
        rate,
        message,
        images,
      }
    })

    if (!reviews.length) {
      break
    }

    const findIndex = reviews.findIndex(
      review => review.reviewId.toString() == lastReviewId
    )

    if (findIndex !== -1) {
      results.push(...reviews.slice(0, findIndex))
      break
    }
    results.push(...reviews)
  } while (results.length < defaultResultSize)

  return results
}
