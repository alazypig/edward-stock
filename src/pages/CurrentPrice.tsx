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
  changeAmount: string
  changePercentage: string
  unknownField9: string
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
        const response = await fetch(
          `http://qt.gtimg.cn/r=${Math.random()}&q=${stockCodes.map((code) => `s_${code}`).join(",")}`,
        )
        const blob = await response.blob()
        const reader = new FileReader()
        reader.onload = () => {
          const text = reader.result as string
          const stockEntries = text.split("\n").filter(Boolean)
          const parsedStocks: StockData[] = []
          console.log(text)

          stockEntries.forEach((entry) => {
            const match = entry.match(/(?:var )?v_s_(\w+)="(.*)";/)

            if (match) {
              const stockCode = match[1]
              const dataString = match[2]
              const dataArray = dataString.split("~")

              parsedStocks.push({
                key: stockCode,
                name: dataArray[1],
                openingPrice: "", // Not available in new format
                previousClosingPrice: "", // Not available in new format
                currentPrice: dataArray[3],
                highestPrice: "", // Not available in new format
                lowestPrice: "", // Not available in new format
                volume: (parseInt(dataArray[6]) / 100).toString(),
                turnover: parseFloat(dataArray[7]).toString(),
                date: "", // Not available in new format
                time: "", // Not available in new format
                changeAmount: dataArray[4],
                changePercentage: dataArray[5],
                unknownField9: dataArray[9],
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
        const percentage = parseFloat(record.changePercentage)
        const color = percentage < 0 ? "red" : "green"
        return <span style={{ color }}>{percentage.toFixed(2)}%</span>
      },
      sorter: (a: StockData, b: StockData) => {
        const percentageA = parseFloat(a.changePercentage)
        const percentageB = parseFloat(b.changePercentage)
        return percentageA - percentageB
      },
      defaultSortOrder: "descend",
    },
    { title: "成交额（万元）", dataIndex: "turnover", key: "turnover" },
    { title: "未知字段", dataIndex: "unknownField9", key: "unknownField9" },
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
