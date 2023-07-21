import { extract } from './blogpay'
;(async () => {
  const url =
    'https://jinsun1576.shop.blogpay.co.kr/good/product_view?goodNum=202835996'
  const lastReviewId = '200600394'
  const results = await extract(url, lastReviewId)

  console.log(results)
})()
