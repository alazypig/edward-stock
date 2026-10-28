import { createContext } from "react"
import type { Stock } from "../type"

export interface StockDataContextType {
  stocks: Stock[]
  loading: boolean
  /** 首次使用时触发全量加载（没有页面消费时不产生请求） */
  ensureLoaded: () => void
  /** 重新拉取数据（绕过 raw.githubusercontent.com 的 CDN 缓存） */
  refetch: () => Promise<void>
}

export const StockDataContext = createContext<StockDataContextType | undefined>(
  undefined,
)
