import { useEffect, useState } from "react"
import { INDEX_FILE, RAW_DATA_BASE } from "../config"
import type { Stock } from "../type"

/**
 * 从最新交易日往前取记录，直到凑满 limit 条，并按整日取整：
 * 边界那天即使让总数超过 limit，也把这个交易日的记录全部保留。
 */
export const takeLatestWholeDays = (
  stocks: Stock[],
  limit: number,
): Stock[] => {
  const sorted = [...stocks].sort((a, b) => b.date.localeCompare(a.date))
  const picked: Stock[] = []

  for (let i = 0; i < sorted.length && picked.length < limit; ) {
    const date = sorted[i].date
    let end = i
    while (end < sorted.length && sorted[end].date === date) end += 1
    // 同一天的记录一定落在同一个月度文件里，所以整日取整不会缺数据
    picked.push(...sorted.slice(i, end))
    i = end
  }

  return picked
}

/**
 * 按「最近 limit 条（整日）」拉取数据：从 index.json 的最新月份开始
 * 逐月下载，凑够条数后立刻停止，不会读取全部历史文件。
 */
export const useRecentStocks = (limit: number) => {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const indexRes = await fetch(`${RAW_DATA_BASE}/${INDEX_FILE}`)
        if (!indexRes.ok) {
          throw new Error(`加载 ${INDEX_FILE} 失败（HTTP ${indexRes.status}）`)
        }
        const indexData = (await indexRes.json()) as { files?: string[] }
        const files = indexData.files ?? []

        const collected: Stock[] = []
        let enough = false

        for (const fileName of files) {
          if (enough) break

          try {
            const res = await fetch(`${RAW_DATA_BASE}/${fileName}`)
            if (!res.ok) continue
            const data = (await res.json()) as { stockData?: Stock[] }
            collected.push(...(data.stockData ?? []))
          } catch (error) {
            console.error(`Failed to fetch ${fileName}`, error)
            continue
          }

          // 月度文件是按整个交易日落盘的，凑够条数就停，边界日已在手上
          enough = takeLatestWholeDays(collected, limit).length >= limit
        }

        if (!cancelled) setStocks(takeLatestWholeDays(collected, limit))
      } catch (error) {
        console.error("Failed to fetch recent stock data", error)
        if (!cancelled) setStocks([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [limit])

  return { stocks, loading }
}
