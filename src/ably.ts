import { ReviewResult } from './type'
import axios from 'axios'

async function getReview(goodsNo: string) {
  const baseUrl = `
  https://api.a-bly.com/api/v2/goods/${goodsNo}/reviews/`

  const { data } = await axios.get<{
    reviews: {
      sno: string
      goods_sno: string
      member_sno: string
      eval: number
      goods_option: string[]
      contents: string
      writer: string
      size_rate: number
      color_rate: number
      images: string[]
      created_at: string
    }[]
  }>(baseUrl)

  return data.reviews
}

export async function extract(url: string, lastReviewId?: string) {
  const urlObj = new URL(url)
  const urls = urlObj.pathname.split('/')
  const goodsNo = urls[urls.length - 1]
  const results: ReviewResult[] = []

  const data = await getReview(goodsNo)
  const reviews: ReviewResult[] = data.map(review => {
    return {
      reviewId: review.sno,
      message: review.contents.trim(),
      writer: review.writer,
      optionValue: review.goods_option,
      date: review.created_at,
      rate: undefined,
      images: review.images,
    }
  })

  if (!reviews.length) {
    return results
  }

  const findIndex = reviews.findIndex(
    review => review.reviewId.toString() === lastReviewId
  )
  if (findIndex !== -1) {
    results.push(...reviews.slice(0, findIndex))
  } else {
    results.push(...reviews)
  }
  return results
}
