import axios from 'axios'
import { ReviewData, ReviewResult } from './type'

const defaultPageSize = 5
const defaultOrderBy = 'new'
const defaultResultSize = 200

async function getReview(
  host: string,
  page: number,
  mgCode: string,
  pageSize = defaultPageSize,
  orderBy = defaultOrderBy
) {
  const baseUrl = `https://${host}/Goods/GetReviewList`
  const response = await axios.post<{
    result: string
    errorMsg: string
    data: {
      cnt: number
      data: ReviewData[]
    }
    dataTotalCount: number
  }>(baseUrl, {
    page,
    pagesize: pageSize,
    mg_code: mgCode,
    orderBy,
  })

  const data = response.data.data.data
  const dataTotalCount = response.data.dataTotalCount

  return {
    data,
    dataTotalCount,
  }
}

export default async function extract(url: string, lastReviewId?: number) {
  const results: ReviewResult[] = []
  const urlObj = new URL(url)
  const host = urlObj.host
  const urls = urlObj.pathname.split('/')
  const mgCode = urls[urls.length - 1]
  let page = 1

  do {
    const { data } = await getReview(host, page++, mgCode)
    if (!data.length) {
      break
    }

    const reviews = data.map(review => {
      return {
        reviewId: review.c_idx,
        message: review.c_content.trim(),
        writer: review.c_name,
        optionValue: '',
        date: review.c_regdate,
        rate: review.c_grade,
        images: review.photoList.split('~|~').filter(photo => photo.length > 0),
      }
    })
    const findIndex = reviews.findIndex(
      review => review.reviewId === lastReviewId
    )
    if (findIndex !== -1) {
      results.push(...reviews.slice(0, findIndex))
      break
    } else {
      results.push(...reviews)
    }
  } while (results.length < defaultResultSize)

  return results
}
