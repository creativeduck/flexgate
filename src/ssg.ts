import axios from 'axios'
import { ReviewResult } from './type'

const defaultPageSize = 10
const defaultResultSize = 200

async function getReview(
  itemId: string,
  page: number,
  pageSize = defaultPageSize
) {
  const baseUrl = 'https://www.ssg.com/item/ajaxItemCommentList.ssg'
  const paramsObj = {
    itemId,
    sortCol: '01',
    page: `${page}`,
    pageSize: `${pageSize}`,
  }
  const params = new URLSearchParams(paramsObj).toString()

  const { data } = await axios.get<{
    pageDto: {
      resultList: {
        postngId: number
        postngTitleNm: string
        wrtDt: string
        wrtHms: string
        uitemNm: string
        mbrLoginId: string
        imgPathNmList: {
          imgPathNm: string
        }[]
        recomEvalAvg: number
      }[]
      totalCount: number
    }
  }>(`${baseUrl}?${params}`, {
    headers: {
      Referer: `https://www.ssg.com/item/itemView.ssg?itemId=${itemId}`,
    },
  })

  return data.pageDto.resultList.map(review => {
    const reviewId = review.postngId.toString()
    const message = review.postngTitleNm.trim()
    const writer = review.mbrLoginId
    const optionValue = review.uitemNm.split('/').map(value => value.trim())
    const date = review.wrtDt
    const rate = review.recomEvalAvg
    const images = review.imgPathNmList
      ? review.imgPathNmList.map(
          img => `https://succ.ssgcdn.com/${img.imgPathNm}`
        )
      : []

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
  const itemId = new URL(url).searchParams.get('itemId')
  let page = 1
  const results: ReviewResult[] = []
  if (!itemId) {
    return results
  }

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
