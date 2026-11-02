export interface GitHubFile {
  content: string
  sha: string
}

/** 估值区间（同一档位的下限 / 上限） */
export interface ValuationRange {
  min: number
  max: number
}

/** 三档估值：保守 / 中性 / 乐观 */
export interface Valuation {
  conservative: ValuationRange
  neutral: ValuationRange
  optimistic: ValuationRange
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
  valuation?: Valuation // 估值区间（选填）
}
