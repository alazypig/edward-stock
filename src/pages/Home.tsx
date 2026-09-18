import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Grid,
  Input,
  List,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "../components"
import { useColorConvention } from "../hooks/useColorConvention"
import { useStockData } from "../hooks/useStockData"
import type { Stock } from "../type"
import { getChangeSemantic } from "../utils/changeColor"

const { useBreakpoint } = Grid

const FutureTag = ({ future }: { future: Stock["future"] }) => {
  const { convention } = useColorConvention()
  if (future === "long") {
    return (
      <Tag
        color={getChangeSemantic(1, convention)}
        style={{ fontWeight: 600 }}
      >
        上涨
      </Tag>
    )
  }
  if (future === "short") {
    return (
      <Tag
        color={getChangeSemantic(-1, convention)}
        style={{ fontWeight: 600 }}
      >
        下跌
      </Tag>
    )
  }
  return <Tag>未知</Tag>
}

export const Home = () => {
  const { stocks, loading, refetch } = useStockData()
  const screens = useBreakpoint()
  const { token } = theme.useToken()

  const [searchTerm, setSearchTerm] = useState("")

  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => b.date.localeCompare(a.date))
  }, [stocks])

  const filteredStocks = useMemo(() => {
    if (!searchTerm) {
      return sortedStocks
    }
    const lower = searchTerm.toLowerCase()
    return sortedStocks.filter(
      (stock) =>
        stock.stockNumber.toLowerCase().includes(lower) ||
        stock.stockName.toLowerCase().includes(lower) ||
        stock.comment.toLowerCase().includes(lower) ||
        stock.industry.some((item) => item.toLowerCase().includes(lower)) ||
        stock.notion.some((item) => item.toLowerCase().includes(lower)),
    )
  }, [sortedStocks, searchTerm])

  const summary = useMemo(() => {
    if (stocks.length === 0) return null
    const dates = new Set(stocks.map((s) => s.date))
    const longCount = stocks.filter((s) => s.future === "long").length
    const shortCount = stocks.filter((s) => s.future === "short").length
    return {
      total: stocks.length,
      dates: dates.size,
      longCount,
      shortCount,
    }
  }, [stocks])

  const columns: ColumnsType<Stock> = [
    { title: "日期", dataIndex: "date", key: "date", width: 130 },
    {
      title: "股票代码",
      dataIndex: "stockNumber",
      key: "stockNumber",
      width: 110,
    },
    {
      title: "股票名称",
      dataIndex: "stockName",
      key: "stockName",
      width: 140,
    },
    {
      title: "收盘价",
      dataIndex: "price",
      key: "price",
      width: 100,
      render: (val: number) => (
        <Typography.Text strong>{val.toFixed(2)}</Typography.Text>
      ),
    },
    {
      title: "行业",
      dataIndex: "industry",
      key: "industry",
      width: 180,
      render: (val: string[]) => (
        <Flex gap={4} wrap align="flex-start">
          {val.map((item) => (
            <Tag key={item} color="blue">
              {item}
            </Tag>
          ))}
        </Flex>
      ),
    },
    {
      title: "概念",
      dataIndex: "notion",
      key: "notion",
      width: 240,
      render: (val: string[]) => (
        <Flex gap={4} wrap align="flex-start">
          {val.map((item) => (
            <Tag key={item} color="purple">
              {item}
            </Tag>
          ))}
        </Flex>
      ),
    },
    {
      title: "预测",
      dataIndex: "future",
      key: "future",
      width: 90,
      render: (val: Stock["future"]) => <FutureTag future={val} />,
    },
    {
      title: "备注",
      dataIndex: "comment",
      key: "comment",
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (val: string) =>
        val ? (
          <Tooltip title={val}>
            <Typography.Text type="secondary">{val}</Typography.Text>
          </Tooltip>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
  ]

  const renderEmpty = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Typography.Text type="secondary">暂无股票记录</Typography.Text>
      }
      style={{ padding: "48px 0" }}
    >
      <Link to="/add">
        <Button type="primary" icon={<PlusOutlined />}>
          添加第一条记录
        </Button>
      </Link>
    </Empty>
  )

  const renderMobileList = () => (
    <List
      loading={loading}
      grid={{ gutter: 16, xs: 1, sm: 2 }}
      dataSource={filteredStocks}
      locale={{ emptyText: renderEmpty }}
      renderItem={(stock: Stock) => (
        <List.Item>
          <Card hoverable size="small" styles={{ body: { padding: 16 } }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
              <Typography.Text strong>
                {stock.stockName}（{stock.stockNumber}）
              </Typography.Text>
              {<FutureTag future={stock.future} />}
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {stock.date}
            </Typography.Text>
            <Descriptions
              column={1}
              size="small"
              style={{ marginTop: 12 }}
              items={[
                {
                  key: "price",
                  label: "收盘价",
                  children: (
                    <Typography.Text strong>{stock.price.toFixed(2)}</Typography.Text>
                  ),
                },
                {
                  key: "industry",
                  label: "行业",
                  children: (
                    <Space size={[4, 4]} wrap>
                      {stock.industry.map((item) => (
                        <Tag key={item} color="blue">
                          {item}
                        </Tag>
                      ))}
                    </Space>
                  ),
                },
                {
                  key: "notion",
                  label: "概念",
                  children: (
                    <Space size={[4, 4]} wrap>
                      {stock.notion.map((item) => (
                        <Tag key={item} color="purple">
                          {item}
                        </Tag>
                      ))}
                    </Space>
                  ),
                },
                ...(stock.comment
                  ? [
                      {
                        key: "comment",
                        label: "备注",
                        children: stock.comment,
                      },
                    ]
                  : []),
              ]}
            />
          </Card>
        </List.Item>
      )}
    />
  )

  const renderDesktopTable = () => (
    <Table<Stock>
      loading={loading}
      dataSource={filteredStocks}
      columns={columns}
      scroll={{ x: true }}
      rowKey="uuid"
      pagination={{
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条`,
        defaultPageSize: 20,
      }}
      locale={{
        emptyText: renderEmpty,
      }}
      style={{ borderRadius: token.borderRadiusLG }}
    />
  )

  return (
    <div>
      <PageHeader
        title="股票列表"
        subtitle={
          summary
            ? `共 ${summary.total} 条记录，覆盖 ${summary.dates} 个交易日 · 看涨 ${summary.longCount} / 看跌 ${summary.shortCount}`
            : "录入你的第一条股票观察"
        }
        extra={
          <>
            <Input
              allowClear
              placeholder="搜索代码、名称、行业或概念"
              prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: screens.md ? 280 : "100%" }}
            />
            <Button icon={<ReloadOutlined />} onClick={refetch}>
              刷新
            </Button>
            <Link to="/add">
              <Button type="primary" icon={<PlusOutlined />}>
                添加记录
              </Button>
            </Link>
          </>
        }
      />
      <div style={{ padding: screens.md ? "24px 32px" : "16px" }}>
        {screens.md ? renderDesktopTable() : renderMobileList()}
      </div>
    </div>
  )
}