import { ArrowLeftOutlined } from "@ant-design/icons"
import {
  Button,
  Card,
  Grid,
  Layout,
  Spin,
  Table,
  theme,
  Typography,
} from "antd"
import dayjs from "dayjs"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useStockData } from "../hooks/useStockData"

const { useBreakpoint } = Grid

interface StockData {
  key: string
  name: string
  openingPrice: string
  previousClosingPrice: string
  currentPrice: string
  highestPrice: string
  lowestPrice: string
  volume: string
  turnover: string
  date: string
  time: string
}

export const CurrentPrice = () => {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const { stocks } = useStockData()
  const { token } = theme.useToken()
  const screens = useBreakpoint()

  const stockCodes = useMemo(() => {
    if (!stocks || stocks.length === 0) {
      return []
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

    const uniqueStockNumbers = [
      ...new Set(recentStocks.map((stock) => stock.stockNumber)),
    ]

    return uniqueStockNumbers.map((stockNumber) => {
      if (stockNumber.startsWith("6")) {
        return `sh${stockNumber}`
      }
      if (stockNumber.startsWith("0") || stockNumber.startsWith("3")) {
        return `sz${stockNumber}`
      }
      return stockNumber
    })
  }, [stocks])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/list=${stockCodes.join(",")}`)
        const blob = await response.blob()
        const reader = new FileReader()
        reader.onload = () => {
          const text = reader.result as string
          const stockEntries = text.split("var ").filter(Boolean)
          const parsedStocks: StockData[] = []

          console.log(text)

          stockEntries.forEach((entry) => {
            const match = entry.match(/(?:var )?hq_str_(\w+)="(.*)";/)

            if (match) {
              const stockCode = match[1]
              const dataString = match[2]
              const dataArray = dataString.split(",")

              parsedStocks.push({
                key: stockCode,
                name: dataArray[0],
                openingPrice: dataArray[1],
                previousClosingPrice: dataArray[2],
                currentPrice: dataArray[3],
                highestPrice: dataArray[4],
                lowestPrice: dataArray[5],
                volume: (parseInt(dataArray[8]) / 100).toString(),
                turnover: (parseInt(dataArray[9]) / 10000).toString(),
                date: dataArray[30],
                time: dataArray[31],
              })
            }
          })
          setStockData(parsedStocks)
          setLoading(false)
        }
        reader.readAsText(blob, "gbk")
      } catch (error) {
        console.error("Failed to fetch current price", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [stockCodes])

  const columns = [
    { title: "股票代码", dataIndex: "key", key: "key" },
    { title: "股票名称", dataIndex: "name", key: "name" },
    { title: "当前价格", dataIndex: "currentPrice", key: "currentPrice" },
    {
      title: "涨跌幅",
      key: "change",
      render: (_: unknown, record: StockData) => {
        const change =
          parseFloat(record.currentPrice) -
          parseFloat(record.previousClosingPrice)
        const percentage =
          (change / parseFloat(record.previousClosingPrice)) * 100
        const color = percentage < 0 ? "red" : "green"
        return <span style={{ color }}>{percentage.toFixed(2)}%</span>
      },
      sorter: (a: StockData, b: StockData) => {
        const percentageA =
          ((parseFloat(a.currentPrice) - parseFloat(a.previousClosingPrice)) /
            parseFloat(a.previousClosingPrice)) *
          100
        const percentageB =
          ((parseFloat(b.currentPrice) - parseFloat(b.previousClosingPrice)) /
            parseFloat(b.previousClosingPrice)) *
          100
        return percentageA - percentageB
      },
      defaultSortOrder: "descend",
    },
    { title: "今日开盘价", dataIndex: "openingPrice", key: "openingPrice" },
    {
      title: "昨日收盘价",
      dataIndex: "previousClosingPrice",
      key: "previousClosingPrice",
    },
    { title: "今日最高价", dataIndex: "highestPrice", key: "highestPrice" },
    { title: "今日最低价", dataIndex: "lowestPrice", key: "lowestPrice" },
    { title: "成交量（手）", dataIndex: "volume", key: "volume" },
    { title: "成交额（万元）", dataIndex: "turnover", key: "turnover" },
    { title: "日期", dataIndex: "date", key: "date" },
    { title: "时间", dataIndex: "time", key: "time" },
  ]

  return (
    <Layout
      style={{
        padding: screens.md ? "2rem" : "1rem",
        backgroundColor: token.colorBgLayout,
      }}
    >
      <Layout.Content>
        <Typography.Title level={2} style={{ marginBottom: "2rem" }}>
          Current Price
        </Typography.Title>
        {loading ? (
          <Spin />
        ) : (
          <Card title="实时行情" style={{ overflow: "hidden" }}>
            <Table
              dataSource={stockData}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              columns={columns as any}
              bordered
              pagination={false}
              scroll={{ y: 500 }}
              style={{ marginTop: "1rem" }}
            />
          </Card>
        )}
        <div style={{ marginTop: "2rem" }}>
          <Link to="/">
            <Button icon={<ArrowLeftOutlined />}>Back to Home</Button>
          </Link>
        </div>
      </Layout.Content>
    </Layout>
  )
}
