import axios from 'axios'
import { ReviewData, ReviewResult } from './type'

async function getReview(
  page: number,
  mgCode: string,
  pageSize = 5,
  orderBy = 'new'
) {
  const baseUrl = 'https://www.goodsendfarmer.com/Goods/GetReviewList'

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

  if (response.data.result !== 'ok') {
    throw new Error()
  }

  const data = response.data.data.data
  const dataTotalCount = response.data.dataTotalCount

  return {
    data,
    dataTotalCount,
  }
}

export default async function extract(url: string, lastReviewId?: number) {
  const urls = url.split('/')
  const mgCode = urls[urls.length - 1]
  let page = 1
  let done = false
  const { data, dataTotalCount } = await getReview(page, mgCode)
  const results: ReviewResult[] = []

  for (const review of data) {
    if (review.c_idx === lastReviewId) {
      done = true
      break
    }

    results.push({
      reviewId: review.c_idx,
      message: review.c_content.trim(),
      writer: review.c_name,
      optionValue: '',
      date: review.c_regdate,
      rate: review.c_grade,
      images: review.photoList.split('~|~').filter(photo => photo.length > 0),
    })
  }

  if (done) {
    return results
  }

  let itemCount = results.length
  while (!done && itemCount < Math.min(dataTotalCount, 200)) {
    const { data } = await getReview(++page, mgCode)
    for (const review of data) {
      if (review.c_idx === lastReviewId) {
        done = true
        break
      }

      results.push({
        reviewId: review.c_idx,
        message: review.c_content.trim(),
        writer: review.c_name,
        optionValue: '',
        date: review.c_regdate,
        rate: review.c_grade,
        images: review.photoList.split('~|~').filter(photo => photo.length > 0),
      })
      itemCount++
    }
  }

  console.log(results)

  return results
}
