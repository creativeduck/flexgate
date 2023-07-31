import axios from 'axios'
import { ReviewResult } from './type'
import { getCodeByPath } from './util'

const defaultResultSize = 200
const defaultLimitSize = 10

async function getReview(
  productCode: string,
  page: number,
  limit = defaultLimitSize
) {
  const baseUrl = `https://www.idus.com/w/product/${productCode}/review/page/${page}/per_item/${limit}`

  const { data } = await axios.get<{
    data: {
      items: {
        uuid: string
        rate: number
        contents: string
        images: {
          picPath: string
        }[]
        created: number
        name: string
        option: string
      }[]
    }
  }>(baseUrl)

  return data.data.items.map(item => {
    const reviewId = item.uuid
    const message = item.contents ? item.contents.trim() : ''
    const writer = item.name
    const optionValue = item.option.split('・').map(option => option.trim())
    const date = new Date(item.created).toString()
    const rate = item.rate
    const images = item.images ? item.images.map(img => img.picPath) : []

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
  const productNo = getCodeByPath(url, 'product')
  if (!productNo) {
    return results
  }

  let page = 1

  do {
    const reviews = await getReview(productNo, page++)

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
