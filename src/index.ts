import extract from './extract'

const url = 'https://www.blancdubu.com/Goods/Detail/SBL86696187'
const lastReviewId = undefined

;(async () => {
  const result = await extract(url, lastReviewId)
  console.log(result)
})()
