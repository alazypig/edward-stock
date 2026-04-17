import { useCallback, useEffect, useState, type ReactNode } from "react"
import type { Stock } from "../type"
import { StockDataContext } from "./StockDataContext"

export const StockDataProvider = ({ children }: { children: ReactNode }) => {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const username = "alazypig"
      const repoName = "edward-stock"

      // 1. Fetch index.json to get list of monthly files
      const indexRes = await fetch(
        `https://raw.githubusercontent.com/${username}/${repoName}/main/data/index.json`,
      )
      const { files } = await indexRes.json()

      // 2. Fetch the most recent 3 monthly files in parallel (to cover ~10 recording days)
      const recentFiles = files.slice(0, 3)
      const fetchPromises = recentFiles.map(async (fileName: string) => {
        const res = await fetch(
          `https://raw.githubusercontent.com/${username}/${repoName}/main/data/${fileName}`,
        )
        if (!res.ok) return { stockData: [] }
        return res.json()
      })

      const results = await Promise.all(fetchPromises)

      // 3. Combine all stock data
      const allStocks = results.reduce((acc, curr) => {
        return [...acc, ...(curr.stockData || [])]
      }, [])

      setStocks(allStocks)
    } catch (error) {
      console.error("Failed to fetch stock data", error)
      setStocks([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const value = {
    stocks,
    loading,
    refetch: fetchData,
  }

  return (
    <StockDataContext.Provider value={value}>
      {children}
    </StockDataContext.Provider>
  )
}
