import { ArrowLeftOutlined } from "@ant-design/icons"
import {
  Button,
  Card,
  Flex,
  Grid,
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

const { useBreakpoint } = Grid

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
  const screens = useBreakpoint()

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
    {
      title: "Count",
      dataIndex: "count",
      key: "count",
      sorter: (a: AnalyzedStock, b: AnalyzedStock) => a.count - b.count,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      defaultSortOrder: "descend" as any,
    },
    {
      title: "Change",
      key: "change",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <Layout
      style={{
        padding: screens.md ? "2rem" : "1rem",
        backgroundColor: token.colorBgLayout,
      }}
    >
      <Layout.Content>
        <Typography.Title level={2} style={{ marginBottom: "2rem" }}>
          Stock Analysis (Last 10 Recorded Days)
        </Typography.Title>
        <Spin spinning={loading}>
          <Flex vertical gap="large">
            <Card
              title="Frequently Occurring Stocks"
              style={{ overflow: "hidden" }}
            >
              <Table
                dataSource={analyzedData}
                columns={columns}
                size="small"
                scroll={{ x: true }}
                pagination={{ pageSize: 5 }}
              />
            </Card>
            <Flex gap="large" wrap>
              <Card
                title="Industry Word Cloud"
                style={{ flex: 1, minWidth: screens.xs ? 330 : 450 }}
              >
                <div style={{ height: "300px", textAlign: "center" }}>
                  {industryWords.length > 0 ? (
                    <WordCloud
                      data={industryWords}
                      width={screens.xs ? 280 : 400}
                      height={200}
                      fontSize={fontSizeMapper}
                    />
                  ) : (
                    <p>No industry data to display.</p>
                  )}
                </div>
              </Card>

              <Card
                title="Notion Word Cloud"
                style={{ flex: 1, minWidth: screens.xs ? 330 : 450 }}
              >
                <div
                  style={{
                    height: "300px",
                    textAlign: "center",
                  }}
                >
                  {notionWords.length > 0 ? (
                    <WordCloud
                      data={notionWords}
                      width={screens.xs ? 280 : 400}
                      height={200}
                      fontSize={fontSizeMapper}
                    />
                  ) : (
                    <p>No notion data to display.</p>
                  )}
                </div>
              </Card>
            </Flex>
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
