export type ReviewData = {
  mog_option: string
  c_name: string
  c_regdate: string
  c_content: string
  c_isview: boolean
  sc_idx: number
  replyList: string
  photoList: string
  c_idx: number
  c_grade: number
  mrl_cnt: number
  mrl_like: number
  mrl_state: string
  review_type: string
}

export type ReviewResult = {
  reviewId: number
  message: string
  writer: string
  optionValue: string // 구할 수 없으면 ''
  date: string
  rate: number | null // 구할 수 없거나 0 이면 null
  images: string[]
}
