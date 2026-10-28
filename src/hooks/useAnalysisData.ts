import dayjs from "dayjs"
import { useMemo } from "react"
import type { Stock } from "../type"

interface AnalyzedStock {
  key: string
  stockNumber: string
  stockName: string
  firstPrice: number
  lastPrice: number
  count: number
}

/**
 * 聚合传入的记录。时间范围由调用方决定（分析页只传最近 N 条），
 * 这里不再额外做时间窗过滤。
 */
export const useAnalysisData = (stocks: Stock[] | undefined) => {
  const { analyzedData, industryWords, notionWords, uniqueCount } =
    useMemo(() => {
      if (!stocks || stocks.length === 0) {
        return {
          analyzedData: [],
          industryWords: [],
          notionWords: [],
          uniqueCount: 0,
        }
      }

      const uniqueCount = new Set(stocks.map((stock) => stock.stockNumber)).size

      // Left Section Data
      const groupedByStockNumber = stocks.reduce(
        (acc, stock) => {
          if (!acc[stock.stockNumber]) {
            acc[stock.stockNumber] = []
          }
          acc[stock.stockNumber].push(stock)
          return acc
        },
        {} as Record<string, Stock[]>,
      )

      const processedData = Object.values(groupedByStockNumber)
        // 只保留出现 2 次以上的股票，"涨跌幅" 才有意义
        .filter((group) => group.length > 1)
        .map((group) => {
          const sortedGroup = group.sort((a, b) =>
            dayjs(a.date).diff(dayjs(b.date)),
          )
          const firstEntry = sortedGroup[0]
          const lastEntry = sortedGroup[sortedGroup.length - 1]
          return {
            key: firstEntry.stockNumber,
            stockNumber: firstEntry.stockNumber,
            stockName: firstEntry.stockName,
            firstPrice: firstEntry.price,
            lastPrice: lastEntry.price,
            count: group.length,
          }
        })

      // Middle & Right Section Data
      const industryWordCounts = stocks
        .flatMap((stock) => stock.industry)
        .reduce(
          (acc, word) => {
            acc[word] = (acc[word] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

      const industryWords = Object.entries(industryWordCounts).map(
        ([text, value]) => ({
          text,
          value,
        }),
      )

      const notionWordCounts = stocks
        .flatMap((stock) => stock.notion)
        .reduce(
          (acc, word) => {
            acc[word] = (acc[word] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

      const notionWords = Object.entries(notionWordCounts).map(
        ([text, value]) => ({
          text,
          value,
        }),
      )

      return {
        analyzedData: processedData,
        industryWords,
        notionWords,
        uniqueCount,
      }
    }, [stocks])

  return { analyzedData, industryWords, notionWords, uniqueCount }
}

export type { AnalyzedStock }
