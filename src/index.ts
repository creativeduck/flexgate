import { extract } from './blogpay'
;(async () => {
  const url =
    'https://polehigh50.shop.blogpay.co.kr/good/product_view?goodNum=203433566'
  const lastReviewId = '200675562'
  const results = await extract(url, lastReviewId)

  console.log(results)
})()
