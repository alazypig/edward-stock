import { Button, Card, Flex, Table, Typography } from "antd"
import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useStockData } from "../contexts/StockDataContext"
import type { Stock } from "../type"

export const Home = () => {
  const { stocks, loading, refetch } = useStockData()

  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => b.date.localeCompare(a.date))
  }, [stocks])

  const columns = [
    { title: "日期", dataIndex: "date", key: "date" },
    { title: "股票号码", dataIndex: "stockNumber", key: "stockNumber" },
    { title: "股票名称", dataIndex: "stockName", key: "stockName" },
    { title: "收盘价", dataIndex: "price", key: "price" },
    {
      title: "行业",
      dataIndex: "industry",
      key: "industry",
      render: (val: string[]) => val.join(","),
    },
    {
      title: "概念",
      dataIndex: "notion",
      key: "notion",
      render: (val: string[]) => val.join(","),
    },
    {
      title: "预测走势",
      dataIndex: "future",
      key: "future",
      render: (val: Stock["future"]) => {
        if (val === "long") {
          return (
            <span style={{ color: "green", fontWeight: "bold" }}>上涨</span>
          )
        } else if (val === "short") {
          return <span style={{ color: "red", fontWeight: "bold" }}>下跌</span>
        }
        return "未知"
      },
    },
    { title: "备注", dataIndex: "comment", key: "comment" },
  ]

  return (
    <Card
      style={{ margin: "2rem" }}
      title={<Typography.Title level={2}>Stock List</Typography.Title>}
      extra={
        <Flex gap="middle">
          <Button onClick={refetch}>Refresh</Button>
          <Link to="/add">
            <Button type="primary">Add New</Button>
          </Link>
          <Link to="/analysis">
            <Button>Analysis</Button>
          </Link>
        </Flex>
      }
    >
      <Table
        loading={loading}
        dataSource={sortedStocks}
        columns={columns}
        scroll={{ x: true }}
        rowKey="uuid"
      />
    </Card>
  )
}
