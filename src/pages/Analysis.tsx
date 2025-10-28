import { ArrowLeftOutlined } from "@ant-design/icons"
import { Button, Card, Flex, Grid, Spin, Table, Typography, theme } from "antd"
import WordCloud from "react-d3-cloud"
import { Link } from "react-router-dom"
import { useAnalysisData, type AnalyzedStock } from "../hooks/useAnalysisData"
import { useStockData } from "../hooks/useStockData"

const { useBreakpoint } = Grid

export const Analysis = () => {
  const { stocks, loading } = useStockData()
  const { token } = theme.useToken()
  const screens = useBreakpoint()

  const { analyzedData, industryWords, notionWords } = useAnalysisData(stocks)

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
            Stock Analysis (Last 10 Recorded Days)
          </Typography.Title>
          <Link to="/">
            <Button icon={<ArrowLeftOutlined />}>Back to Home</Button>
          </Link>
        </Flex>
      </div>
      <div
        style={{
          padding: screens.md ? "1rem" : "0.5rem",
          backgroundColor: token.colorBgLayout,
        }}
      >
        <Spin spinning={loading}>
          <Flex vertical gap="middle">
            <Card
              title="Frequently Occurring Stocks"
              style={{ overflow: "hidden" }}
            >
              <Table
                dataSource={analyzedData}
                columns={columns}
                size="small"
                scroll={{ x: true, y: 300 }}
                pagination={{ pageSize: 5 }}
              />{" "}
            </Card>
            <Flex gap="middle" wrap>
              <Card
                title="Industry Word Cloud"
                style={{ flex: 1, minWidth: screens.xs ? 330 : 450 }}
              >
                <div style={{ height: "200px", textAlign: "center" }}>
                  {industryWords.length > 0 ? (
                    <WordCloud
                      data={industryWords}
                      width={screens.xs ? 280 : 400}
                      height={150}
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
                    height: "200px",
                    textAlign: "center",
                  }}
                >
                  {notionWords.length > 0 ? (
                    <WordCloud
                      data={notionWords}
                      width={screens.xs ? 280 : 400}
                      height={150}
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
      </div>
    </div>
  )
}
