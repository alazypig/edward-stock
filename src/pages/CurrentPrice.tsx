import { ReloadOutlined } from "@ant-design/icons"
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Grid,
  List,
  Space,
  Table,
  Tag,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useCallback, useEffect, useMemo, useState } from "react"
import { PageHeader } from "../components"
import { useColorConvention } from "../hooks/useColorConvention"
import { useStockData } from "../hooks/useStockData"
import { getChangeHex, getChangeSemantic } from "../utils/changeColor"

const { useBreakpoint } = Grid

interface StockData {
  key: string
  name: string
  currentPrice: number
  volume: number
  turnover: number
  changeAmount: number
  changePercentage: number
  marketCap: number
}

const parseStock = (raw: string): StockData | null => {
  const match = raw.match(/(?:var )?v_s_(\w+)="(.*)";/)
  if (!match) return null

  const stockCode = match[1]
  const fields = match[2].split("~")
  return {
    key: stockCode,
    name: fields[1],
    currentPrice: Number(fields[3]),
    changeAmount: Number(fields[4]),
    changePercentage: Number(fields[5]),
    volume: Math.round(Number(fields[6]) / 100),
    turnover: Number(fields[7]),
    marketCap: Number(fields[9]),
  }
}

const withMarketPrefix = (stockNumber: string): string => {
  if (stockNumber.startsWith("6")) return `sh${stockNumber}`
  if (stockNumber.startsWith("0") || stockNumber.startsWith("3")) {
    return `sz${stockNumber}`
  }
  return stockNumber
}

export const CurrentPrice = () => {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const { stocks } = useStockData()
  const { convention } = useColorConvention()
  const screens = useBreakpoint()

  const stockCodes = useMemo(() => {
    if (!stocks || stocks.length === 0) return []

    const uniqueDates = [...new Set(stocks.map((stock) => stock.date))]
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 10)
    const last10DatesSet = new Set(uniqueDates)

    const recentStocks = stocks.filter((stock) => last10DatesSet.has(stock.date))
    const uniqueNumbers = new Set(recentStocks.map((s) => s.stockNumber))

    return Array.from(uniqueNumbers).map(withMarketPrefix)
  }, [stocks])

  const fetchData = useCallback(async () => {
    if (stockCodes.length === 0) {
      setStockData([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await fetch(
        `https://qt.gtimg.cn/r=${Math.random()}&q=${stockCodes.map((code) => `s_${code}`).join(",")}`,
      )
      const buffer = await response.arrayBuffer()
      const text = new TextDecoder("gbk").decode(buffer)
      const parsed = text
        .split("\n")
        .filter(Boolean)
        .map(parseStock)
        .filter((s): s is StockData => s !== null)
      setStockData(parsed)
      setLastUpdated(dayjs().format("HH:mm:ss"))
    } catch (error) {
      console.error("Failed to fetch current price", error)
    } finally {
      setLoading(false)
    }
  }, [stockCodes])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const renderChangeTag = (pct: number) => {
    return (
      <Tag
        color={getChangeSemantic(pct, convention)}
        style={{ fontWeight: 600, margin: 0, borderRadius: 4 }}
      >
        {pct > 0 ? "+" : ""}
        {pct.toFixed(2)}%
      </Tag>
    )
  }

  const columns: ColumnsType<StockData> = [
    { title: "股票代码", dataIndex: "key", key: "key", width: 120 },
    { title: "股票名称", dataIndex: "name", key: "name", width: 140 },
    {
      title: "当前价",
      dataIndex: "currentPrice",
      key: "currentPrice",
      width: 100,
      render: (val: number) => <Typography.Text strong>{val.toFixed(2)}</Typography.Text>,
    },
    {
      title: "今日涨跌",
      key: "change",
      width: 170,
      render: (_, record) => {
        const amount = record.changeAmount
        const color = getChangeHex(amount, convention)
        return (
          <Space size={6} align="center">
            <Typography.Text
              strong
              style={{ color, fontVariantNumeric: "tabular-nums" }}
            >
              {amount > 0 ? "+" : ""}
              {amount.toFixed(2)}
            </Typography.Text>
            {renderChangeTag(record.changePercentage)}
          </Space>
        )
      },
    },
    {
      title: "成交量（手）",
      dataIndex: "volume",
      key: "volume",
      width: 110,
    },
    {
      title: "成交额（万元）",
      dataIndex: "turnover",
      key: "turnover",
      width: 130,
      render: (val: number) => val.toLocaleString("zh-CN"),
    },
    {
      title: "市值（亿）",
      dataIndex: "marketCap",
      key: "marketCap",
      width: 110,
      render: (val: number) => val.toLocaleString("zh-CN"),
    },
  ]

  const renderEmpty = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Typography.Text type="secondary">
          最近 10 个交易日暂无股票记录，先去添加吧
        </Typography.Text>
      }
      style={{ padding: "48px 0" }}
    />
  )

  const renderMobileList = () => (
    <List
      loading={loading}
      grid={{ gutter: 16, xs: 1, sm: 2 }}
      dataSource={stockData}
      locale={{ emptyText: renderEmpty }}
      renderItem={(stock) => (
        <List.Item>
          <Card hoverable size="small" styles={{ body: { padding: 16 } }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
              <Typography.Text strong>
                {stock.name}（{stock.key}）
              </Typography.Text>
              <Tag>{stock.currentPrice.toFixed(2)}</Tag>
            </Flex>
            <Descriptions
              column={1}
              size="small"
              items={[
                {
                  key: "change",
                  label: "今日涨跌",
                  children: renderChangeTag(stock.changePercentage),
                },
                {
                  key: "volume",
                  label: "成交量（手）",
                  children: stock.volume.toLocaleString("zh-CN"),
                },
                {
                  key: "turnover",
                  label: "成交额（万元）",
                  children: stock.turnover.toLocaleString("zh-CN"),
                },
                {
                  key: "marketCap",
                  label: "市值（亿）",
                  children: stock.marketCap.toLocaleString("zh-CN"),
                },
              ]}
            />
          </Card>
        </List.Item>
      )}
    />
  )

  const renderDesktopTable = () => (
    <Table<StockData>
      loading={loading}
      dataSource={stockData}
      columns={columns}
      bordered={false}
      pagination={false}
      scroll={{ y: 500 }}
      locale={{ emptyText: renderEmpty }}
      rowKey="key"
    />
  )

  return (
    <div>
      <PageHeader
        title="实时行情"
        subtitle={
          lastUpdated
            ? `最后更新：${lastUpdated} · 共 ${stockData.length} 只股票`
            : "读取最近 10 个交易日出现过的股票实时报价"
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新
          </Button>
        }
      />
      <div style={{ padding: screens.md ? "24px 32px" : "16px" }}>
        {screens.md ? renderDesktopTable() : renderMobileList()}
      </div>
    </div>
  )
}