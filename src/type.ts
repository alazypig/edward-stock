export interface GitHubFile {
  content: string
  sha: string
}

export interface Stock {
  uuid: string
  date: string
  stockNumber: string // 股票号码
  stockName: string
  price: number // 当天收盘价
  industry: string[] // 行业
  notion: string[] // 相关概念
  future: "long" | "short" | "none" // 未来走势
  comment: string // 备注
}
