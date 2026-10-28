import { useContext, useEffect } from "react"
import { StockDataContext } from "../contexts/StockDataContext.ts"

export const useStockData = () => {
  const context = useContext(StockDataContext)
  if (context === undefined) {
    throw new Error("useStockData must be used within a StockDataProvider")
  }

  // 首次消费时才触发全量加载（懒加载，分析页不会触发）
  const { ensureLoaded } = context
  useEffect(() => {
    ensureLoaded()
  }, [ensureLoaded])

  return context
}
