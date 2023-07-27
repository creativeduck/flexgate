import axios from 'axios'
import { load } from 'cheerio'
import { ReviewResult } from './type'

const defaultResultSize = 200

async function getMediumCd(itemCd: string) {
  const baseUrl = 'https://www.wconcept.co.kr/Ajax/GetProductsInfo?'
  const paramsObj = {
    itemcds: itemCd,
  }
  const params = new URLSearchParams(paramsObj).toString()

  const { data } = await axios.post(`${baseUrl}?${params}`)
  return data.mediumCd
}

async function getReview(itemCd: string, mediumCd: string, page: number) {
  const baseUrl = 'https://www.wconcept.co.kr/Ajax/ProductReViewList'
  const paramsObj = {
    itemcd: itemCd,
    pageIndex: `${page}`,
    order: '1',
    mediumcd: mediumCd,
  }

  const params = new URLSearchParams(paramsObj).toString()
  const { data } = await axios.get(`${baseUrl}?${params}`)
  const $ = load(data)
  const reviews = $('table.pdt_review_table > tbody').children().toArray()
  const results: ReviewResult[] = []

  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i]
    const writer = $(review).find('p.product_review_info_right > em').text()
    const date = $(review).find('p.product_review_info_right > span').text()
    const optionText = $(review).find('div.pdt_review_option > p > span').text()
    if (optionText.length < 2) {
      continue
    }
    const optionValue = optionText
      .split(':')[1]
      .split(',')
      .map(value => value.trim())
    const message = $(review).find('p.pdt_review_text').text().trim()
    const liList = $(review).find('ul.pdt_review_photo').children().toArray()
    const images = liList
      .map(li => $(li).find('img').attr('src') || '')
      .filter(img => img.length > 0)
    const rate = undefined
    const reviewId =
      $(review).find('div.btn_report_item > button').attr('data-idxnum') ||
      `${date}-${writer}`

    if (!writer) {
      continue
    }

    results.push({
      reviewId,
      writer,
      optionValue,
      date,
      rate,
      message,
      images,
    })
  }

  return results
}

export async function extract(url: string, lastReviewId?: string) {
  const urls = new URL(url).pathname.split('/')
  const itemcd = urls[urls.length - 1]
  const mediumCd = await getMediumCd(itemcd)
  let page = 1
  const results: ReviewResult[] = []

  do {
    const reviews = await getReview(itemcd, mediumCd, page++)
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
