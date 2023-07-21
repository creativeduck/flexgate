import axios from 'axios'
import { ReviewData, ReviewResult } from './type'

async function getReview(
  host: string,
  page: number,
  mgCode: string,
  pageSize = 5,
  orderBy = 'new'
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
    page: page,
    pagesize: pageSize,
    mg_code: mgCode,
    orderBy: orderBy,
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
  let itemCount = 0
  let done = false
  const { dataTotalCount } = await getReview(host, page, mgCode)
  const max = lastReviewId ? dataTotalCount : Math.min(dataTotalCount, 200)

  while (!done && itemCount < max) {
    const { data } = await getReview(host, page++, mgCode)
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
      done = true
    } else {
      results.push(...reviews)
      itemCount += 5
    }
  }

  return results
}
