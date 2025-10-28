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

export const useAnalysisData = (stocks: Stock[] | undefined) => {
  const { analyzedData, industryWords, notionWords } = useMemo(() => {
    if (!stocks || stocks.length === 0) {
      return { analyzedData: [], industryWords: [], notionWords: [] }
    }

    const allDates = stocks.map((stock) => stock.date)
    const uniqueSortedDates = [...new Set(allDates)].sort((a, b) =>
      dayjs(b).diff(a),
    )
    const last10Dates = uniqueSortedDates.slice(0, 10)
    const last10DatesSet = new Set(last10Dates)

    const recentStocks = stocks.filter((stock) =>
      last10DatesSet.has(stock.date),
    )

    // Left Section Data
    const groupedByStockNumber = recentStocks.reduce(
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
    const industryWordCounts = recentStocks
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

    const notionWordCounts = recentStocks
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

    return { analyzedData: processedData, industryWords, notionWords }
  }, [stocks])

  return { analyzedData, industryWords, notionWords }
}

export type { AnalyzedStock }
