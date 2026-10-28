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
import type { SortOrder } from "antd/es/table/interface"
import dayjs from "dayjs"
import { useCallback, useEffect, useMemo, useState } from "react"
import { PageHeader } from "../components"
import { ANALYSIS_RECORD_LIMIT } from "../config"
import { useColorConvention } from "../hooks/useColorConvention"
import { useRecentStocks } from "../hooks/useRecentStocks"
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
  // 腾讯 s_ 简版接口字段：1=名称 3=现价 4=涨跌额 5=涨跌幅
  // 6=成交量(手) 7=成交额(万元) 9=总市值(亿元)
  return {
    key: stockCode,
    name: fields[1],
    currentPrice: Number(fields[3]),
    changeAmount: Number(fields[4]),
    changePercentage: Number(fields[5]),
    volume: Number(fields[6]),
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
  const [quotesLoading, setQuotesLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  // 与分析页一致：只取最近 100 条记录里出现过的股票
  const { stocks, loading: stocksLoading } = useRecentStocks(
    ANALYSIS_RECORD_LIMIT,
  )
  const { convention } = useColorConvention()
  const screens = useBreakpoint()

  const loading = quotesLoading || stocksLoading

  const stockCodes = useMemo(() => {
    const uniqueNumbers = new Set(stocks.map((stock) => stock.stockNumber))
    return Array.from(uniqueNumbers).map(withMarketPrefix)
  }, [stocks])

  const fetchData = useCallback(async () => {
    if (stockCodes.length === 0) {
      setStockData([])
      setQuotesLoading(false)
      return
    }
    setQuotesLoading(true)
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
      setQuotesLoading(false)
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

  // 默认涨幅最高的排最前；点击表头在「降序 ⇄ 升序」之间切换。
  // 移动端列表没有表头，直接沿用当前顺序。
  const [sortOrder, setSortOrder] = useState<SortOrder>("descend")

  const sortedStockData = useMemo(() => {
    if (sortOrder !== "ascend" && sortOrder !== "descend") return stockData
    const direction = sortOrder === "ascend" ? 1 : -1
    return [...stockData].sort(
      (a, b) => (a.changePercentage - b.changePercentage) * direction,
    )
  }, [stockData, sortOrder])

  const columns: ColumnsType<StockData> = [
    { title: "股票代码", dataIndex: "key", key: "key", width: 120 },
    { title: "股票名称", dataIndex: "name", key: "name", width: 140 },
    {
      title: "当前价",
      dataIndex: "currentPrice",
      key: "currentPrice",
      width: 100,
      render: (val: number) => (
        <Typography.Text strong>{val.toFixed(2)}</Typography.Text>
      ),
    },
    {
      title: "今日涨跌",
      key: "change",
      width: 190,
      sorter: (a, b) => a.changePercentage - b.changePercentage,
      sortOrder,
      sortDirections: ["descend", "ascend"],
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
          最近 100 条记录中暂无股票，先去添加吧
        </Typography.Text>
      }
      style={{ padding: "48px 0" }}
    />
  )

  const renderMobileList = () => (
    <List
      loading={loading}
      grid={{ gutter: 16, xs: 1, sm: 2 }}
      dataSource={sortedStockData}
      locale={{ emptyText: renderEmpty }}
      renderItem={(stock) => (
        <List.Item>
          <Card hoverable size="small" styles={{ body: { padding: 16 } }}>
            <Flex
              justify="space-between"
              align="center"
              style={{ marginBottom: 8 }}
            >
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
      dataSource={sortedStockData}
      columns={columns}
      bordered={false}
      pagination={false}
      scroll={{ y: 500 }}
      locale={{ emptyText: renderEmpty }}
      rowKey="key"
      onChange={(_, __, sorter) => {
        const current = Array.isArray(sorter) ? sorter[0] : sorter
        // antd 第三次点击会回到「无排序」，这里补成升/降序循环
        setSortOrder(
          current?.order ?? (sortOrder === "descend" ? "ascend" : "descend"),
        )
      }}
    />
  )

  return (
    <div>
      <PageHeader
        title="实时行情"
        subtitle={
          lastUpdated
            ? `最后更新：${lastUpdated} · 共 ${stockData.length} 只股票`
            : "读取最近 100 条记录中出现过的股票实时报价"
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
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
