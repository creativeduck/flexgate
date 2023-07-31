import axios from 'axios'
import { ReviewResult } from './type'
import { getCodeByPath } from './util'

const defaultLimitSize = 5
const defaultResultSize = 200

async function getReview(
  productNo: string,
  offset: number,
  limit = defaultLimitSize
) {
  const baseUrl = `https://brandi-api.brandi.biz/v2/web/products/${productNo}/reviews`
  const paramsObj = {
    limit: limit.toString(),
    offset: offset.toString(),
    'tab-type': 'all',
  }
  const params = new URLSearchParams(paramsObj).toString()

  const { data } = await axios.get<{
    data: {
      text: string
      id: string
      created_time: number
      product: {
        option_name: string
      }
      user: {
        name: string
      }
      evaluation: {
        satisfaction: number
      }
      images: {
        image_url: string
      }[]
    }[]
  }>(`${baseUrl}?${params}`)

  return data.data.map(review => {
    const reviewId = review.id
    const message = review.text.trim()
    const writer = review.user.name
    const optionValue = review.product.option_name
      .split('/')
      .map(option => option.trim())
    const date = new Date(review.created_time * 1000).toString()
    const rate = review.evaluation.satisfaction
    const images = review.images ? review.images.map(img => img.image_url) : []

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
  const productNo = getCodeByPath(url, 'products')
  if (!productNo) {
    return results
  }

  let offset = 0

  do {
    const reviews = await getReview(productNo, offset)

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

    offset += defaultLimitSize
  } while (results.length < defaultResultSize)

  return results
}
