import axios from 'axios'
import { ReviewResult } from './type'

const defaultLimitCount = 5
const defaultResultSize = 200
const defaultOrder = 'BEST_SCORE_DESC'

async function getReview(
  productId: string,
  skipCount = 0,
  limitCount = defaultLimitCount,
  order = defaultOrder
) {
  const url = 'https://api.zigzag.kr/api/2/graphql/GetNormalReviewFeedList'
  const query = `
  fragment ReviewFeedListOnFeed on ProductReviewList { 
    total_count item_list { 
      ...ReviewFeedItemOnFeed 
    } 
  } 
  fragment ReviewFeedItemOnFeed on ProductReview { 
    id 
    status 
    contents 
    date_created 
    date_updated 
    rating 
    product_type 
    country 
    country_name 
    attachment_list { 
      type 
      original_url 
      thumbnail_url 
      status 
    } 
    attribute_list { 
      question { 
        label 
        value 
        category 
      } 
      answer { 
        label 
        value 
      } 
    } 
    reviewer { 
      masked_email 
      body_text 
    }
    order_item { 
      product_info { 
        options 
        option_detail_list { 
          name 
          value 
        } 
      } 
    } 
  } 
  
  query GetNormalReviewFeedList($product_id: ID!, $limit_count: Int, $skip_count: Int, $order: ProductReviewListOrderType) { 
    feed_list: product_review_list(product_id: $product_id, limit_count: $limit_count, skip_count: $skip_count, order: $order) { 
      ...ReviewFeedListOnFeed
    } 
  }`

  const { data } = await axios.post<{
    data: {
      feed_list: {
        total_count: number
        item_list: {
          id: string
          country: string
          contents: string
          date_created: number
          attachment_list: {
            original_url: string
            thumbnail_url: string
          }[]
          rating: number
          reviewer: {
            masked_name: string
            masked_email: string
          }
          order_item: {
            product_info: {
              options: string
              option_detail_list: {
                name: string
                value: string
              }[]
            }
          }
        }[]
      }
    }
  }>(url, {
    operationName: 'GetNormalReviewFeedList',
    query: query,
    variables: {
      product_id: productId,
      limit_count: limitCount,
      skip_count: skipCount,
      order,
    },
  })

  return data.data.feed_list.item_list
}

export async function extract(url: string, lastReviewId?: string) {
  const urlObj = new URL(url)
  const urls = urlObj.pathname.split('/')
  const productId = urls[urls.length - 1]
  let skipCount = 0
  const results: ReviewResult[] = []

  do {
    const data = await getReview(productId, skipCount)
    const reviews = data.map(review => {
      const reviewId = review.id
      const writer = review.reviewer.masked_name || review.reviewer.masked_email
      const date = new Date(review.date_created).toString()
      const rate = review.rating
      const message = review.contents
      const optionValue = [review.order_item.product_info.options]
      const images = review.attachment_list.map(img => img.original_url)

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
      review => review.reviewId === lastReviewId
    )

    if (findIndex !== -1) {
      results.push(...reviews.slice(0, findIndex))
      break
    }
    results.push(...reviews)
    skipCount += defaultLimitCount
  } while (results.length < defaultResultSize)

  return results
}
