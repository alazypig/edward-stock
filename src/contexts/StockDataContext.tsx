import { useCallback, useRef, useState, type ReactNode } from "react"
import { INDEX_FILE, RAW_DATA_BASE } from "../config"
import type { Stock } from "../type"
import { StockDataContext } from "./StockDataContext"

interface FetchOptions {
  /**
   * raw.githubusercontent.com 会被 CDN 缓存几分钟，写入后需要带随机参数
   * 才能立刻读到新数据。
   */
  bypassCache?: boolean
}

export const StockDataProvider = ({ children }: { children: ReactNode }) => {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  const fetchData = useCallback(
    async ({ bypassCache = false }: FetchOptions) => {
      const cacheSuffix = bypassCache ? `?t=${Date.now()}` : ""
      setLoading(true)
      try {
        // 1. Fetch index.json to get list of monthly files (newest first)
        const indexRes = await fetch(
          `${RAW_DATA_BASE}/${INDEX_FILE}${cacheSuffix}`,
        )
        if (!indexRes.ok) {
          throw new Error(`加载 ${INDEX_FILE} 失败（HTTP ${indexRes.status}）`)
        }
        const indexData = (await indexRes.json()) as { files?: string[] }
        const files = indexData.files ?? []

        // 2. Fetch every monthly file in parallel. A broken month must not
        //    take down the whole list, so failures fall back to an empty array.
        const monthlyStocks = await Promise.all(
          files.map(async (fileName): Promise<Stock[]> => {
            try {
              const res = await fetch(
                `${RAW_DATA_BASE}/${fileName}${cacheSuffix}`,
              )
              if (!res.ok) return []
              const data = (await res.json()) as { stockData?: Stock[] }
              return data.stockData ?? []
            } catch (error) {
              console.error(`Failed to fetch ${fileName}`, error)
              return []
            }
          }),
        )

        // 3. Combine all stock data
        setStocks(monthlyStocks.flat())
      } catch (error) {
        console.error("Failed to fetch stock data", error)
        setStocks([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const refetch = useCallback(() => {
    loadedRef.current = true
    return fetchData({ bypassCache: true })
  }, [fetchData])

  // 懒加载：只有页面真正消费数据（useStockData）时才全量拉取，
  // 分析页有自己的「最近 100 条」数据源，不会触发这里。
  const ensureLoaded = useCallback(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    void fetchData({})
  }, [fetchData])

  const value = {
    stocks,
    loading,
    ensureLoaded,
    refetch,
  }

  return (
    <StockDataContext.Provider value={value}>
      {children}
    </StockDataContext.Provider>
  )
}
