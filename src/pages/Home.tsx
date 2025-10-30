import {
  Button,
  Card,
  Descriptions,
  Flex,
  Grid,
  Input,
  List,
  Table,
  Tag,
  Typography,
  theme,
} from "antd"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useStockData } from "../hooks/useStockData"
import type { Stock } from "../type"

const { useBreakpoint } = Grid

const renderFuture = (val: Stock["future"]) => {
  if (val === "long") {
    return <span style={{ color: "green", fontWeight: "bold" }}>上涨</span>
  } else if (val === "short") {
    return <span style={{ color: "red", fontWeight: "bold" }}>下跌</span>
  }
  return "未知"
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
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return sortedStocks.filter(
      (stock) =>
        stock.stockNumber.toLowerCase().includes(lowerCaseSearchTerm) ||
        stock.stockName.toLowerCase().includes(lowerCaseSearchTerm) ||
        stock.comment.toLowerCase().includes(lowerCaseSearchTerm) ||
        stock.industry.some((industry) =>
          industry.toLowerCase().includes(lowerCaseSearchTerm),
        ) ||
        stock.notion.some((notion) =>
          notion.toLowerCase().includes(lowerCaseSearchTerm),
        ),
    )
  }, [sortedStocks, searchTerm])

  const columns = [
    { title: "日期", dataIndex: "date", key: "date" },
    { title: "股票号码", dataIndex: "stockNumber", key: "stockNumber" },
    { title: "股票名称", dataIndex: "stockName", key: "stockName" },
    { title: "收盘价", dataIndex: "price", key: "price" },
    {
      title: "行业",
      dataIndex: "industry",
      key: "industry",
      render: (val: string[]) => (
        <>
          {val.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </>
      ),
    },
    {
      title: "概念",
      dataIndex: "notion",
      key: "notion",
      render: (val: string[]) => (
        <>
          {val.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </>
      ),
    },
    {
      title: "预测走势",
      dataIndex: "future",
      key: "future",
      render: renderFuture,
    },
    { title: "备注", dataIndex: "comment", key: "comment" },
  ]

  const renderMobileList = () => (
    <List
      loading={loading}
      grid={{ gutter: 16, xs: 1, sm: 2 }}
      dataSource={filteredStocks}
      renderItem={(stock: Stock) => (
        <List.Item>
          <Card
            hoverable
            title={`${stock.stockName} (${stock.stockNumber})`}
            size="small"
          >
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="日期">{stock.date}</Descriptions.Item>
              <Descriptions.Item label="收盘价">
                {stock.price}
              </Descriptions.Item>
              <Descriptions.Item label="预测走势">
                {renderFuture(stock.future)}
              </Descriptions.Item>
              <Descriptions.Item label="行业">
                {stock.industry.map((item) => (
                  <Tag key={item}>{item}</Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="概念">
                {stock.notion.map((item) => (
                  <Tag key={item}>{item}</Tag>
                ))}
              </Descriptions.Item>
              {stock.comment && (
                <Descriptions.Item label="备注">
                  {stock.comment}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </List.Item>
      )}
    />
  )

  const renderDesktopTable = () => (
    <Table
      loading={loading}
      dataSource={filteredStocks}
      columns={columns}
      scroll={{ x: true }}
      rowKey="uuid"
    />
  )

  return (
    <div>
      <div
        style={{
          backgroundColor: token.colorBgContainer,
          padding: "1rem",
          borderBottom: `1px solid ${token.colorBorder}`,
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <Flex justify="space-between" align="center" wrap="wrap">
          <Typography.Title level={2} style={{ margin: "0.5rem 0" }}>
            Stock List
          </Typography.Title>
          <Input.Search
            placeholder="搜索股票号码、名称、行业或概念"
            allowClear
            onSearch={setSearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
          />
          <Flex gap="middle" wrap="wrap">
            <Button onClick={refetch}>Refresh</Button>
            <Link to="/add">
              <Button type="primary">Add New</Button>
            </Link>
            <Link to="/analysis">
              <Button>Analysis</Button>
            </Link>
            <Link to="/current-price">
              <Button>Current Price</Button>
            </Link>
          </Flex>
        </Flex>
      </div>
      <div style={{ padding: screens.md ? "2rem" : "1rem" }}>
        {screens.md ? renderDesktopTable() : renderMobileList()}
      </div>
    </div>
  )
}
