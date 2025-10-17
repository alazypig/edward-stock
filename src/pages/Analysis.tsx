import { ArrowLeftOutlined } from "@ant-design/icons"
import {
  Button,
  Card,
  Flex,
  Layout,
  Spin,
  Table,
  Typography,
  theme,
} from "antd"
import dayjs from "dayjs"
import { useMemo } from "react"
import WordCloud from "react-d3-cloud"
import { Link } from "react-router-dom"
import { useStockData } from "../contexts/StockDataContext"
import type { Stock } from "../type"

interface AnalyzedStock {
  key: string
  stockNumber: string
  stockName: string
  firstPrice: number
  lastPrice: number
  count: number
}

export const Analysis = () => {
  const { stocks, loading } = useStockData()
  const { token } = theme.useToken()

  const { analyzedData, industryWords, notionWords } = useMemo(() => {
    if (!stocks || stocks.length === 0) {
      return { analyzedData: [], industryWords: [], notionWords: [] }
    }

    const tenDaysAgo = dayjs().subtract(10, "day")
    const recentStocks = stocks.filter((stock) =>
      dayjs(stock.date).isAfter(tenDaysAgo),
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
      ([text, value]) => ({ text, value }),
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

  const columns = [
    { title: "Stock Number", dataIndex: "stockNumber", key: "stockNumber" },
    { title: "Stock Name", dataIndex: "stockName", key: "stockName" },
    { title: "First Price", dataIndex: "firstPrice", key: "firstPrice" },
    { title: "Last Price", dataIndex: "lastPrice", key: "lastPrice" },
    { title: "Count", dataIndex: "count", key: "count" },
    {
      title: "Change",
      key: "change",
      render: (_: any, record: AnalyzedStock) => {
        const { firstPrice, lastPrice } = record
        if (firstPrice === 0) {
          return <span>-</span>
        }
        const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100
        const color = percentageChange < 0 ? "red" : "green"
        return <span style={{ color }}>{percentageChange.toFixed(2)}%</span>
      },
    },
  ]

  const fontSizeMapper = (word: { value: number }) => Math.log2(word.value) * 30

  return (
    <Layout style={{ padding: "2rem", backgroundColor: token.colorBgLayout }}>
      <Layout.Content>
        <Typography.Title level={2} style={{ marginBottom: "2rem" }}>
          Stock Analysis (Last 10 Days)
        </Typography.Title>
        <Spin spinning={loading}>
          <Flex gap="large">
            <Card
              title="Frequently Occurring Stocks"
              style={{ flex: 3, overflow: "hidden" }}
            >
              <Table
                dataSource={analyzedData}
                columns={columns}
                size="small"
                scroll={{ x: true }}
              />
            </Card>

            <Card title="Industry Word Cloud" style={{ flex: 2 }}>
              <div style={{ height: "400px", textAlign: "center" }}>
                {industryWords.length > 0 ? (
                  <WordCloud
                    data={industryWords}
                    width={400}
                    height={400}
                    fontSize={fontSizeMapper}
                  />
                ) : (
                  <p>No industry data to display.</p>
                )}
              </div>
            </Card>

            <Card title="Notion Word Cloud" style={{ flex: 2 }}>
              <div style={{ height: "400px", textAlign: "center" }}>
                {notionWords.length > 0 ? (
                  <WordCloud
                    data={notionWords}
                    width={400}
                    height={400}
                    fontSize={fontSizeMapper}
                  />
                ) : (
                  <p>No notion data to display.</p>
                )}
              </div>
            </Card>
          </Flex>
        </Spin>
        <div style={{ marginTop: "2rem" }}>
          <Link to="/">
            <Button icon={<ArrowLeftOutlined />}>Back to Home</Button>
          </Link>
        </div>
      </Layout.Content>
    </Layout>
  )
}
