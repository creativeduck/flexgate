export type ReviewData = {
  mog_option: string
  c_name: string
  c_regdate: string
  c_content: string
  c_isview: boolean
  sc_idx: number
  replyList: string
  photoList: string
  c_idx: string
  c_grade: number
  mrl_cnt: number
  mrl_like: number
  mrl_state: string
  review_type: string
}

export type ReviewResult = {
  reviewId: string
  message: string
  writer: string
  optionValue: string[]
  date: string
  rate: number | null
  images: string[]
}
