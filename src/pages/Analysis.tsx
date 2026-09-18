import { CalendarOutlined, FundOutlined, StockOutlined } from "@ant-design/icons"
import {
  Card,
  Flex,
  Grid,
  Spin,
  Statistic,
  Table,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import type { SortOrder } from "antd/es/table/interface"
import WordCloud from "react-d3-cloud"
import { PageHeader } from "../components"
import { useAnalysisData, type AnalyzedStock } from "../hooks/useAnalysisData"
import { useColorConvention } from "../hooks/useColorConvention"
import { useStockData } from "../hooks/useStockData"
import { getChangeHex } from "../utils/changeColor"

const { useBreakpoint } = Grid

const fontSizeMapper = (word: { value: number }) =>
  Math.max(12, Math.log2(Math.max(2, word.value)) * 12)

export const Analysis = () => {
  const { stocks, loading } = useStockData()
  const { convention } = useColorConvention()
  const screens = useBreakpoint()

  const { analyzedData, industryWords, notionWords } = useAnalysisData(stocks)

  const summary = {
    total: stocks.length,
    unique: analyzedData.length,
    industries: industryWords.length,
    notions: notionWords.length,
  }

  const columns: ColumnsType<AnalyzedStock> = [
    {
      title: "股票代码",
      dataIndex: "stockNumber",
      key: "stockNumber",
      width: 120,
    },
    {
      title: "股票名称",
      dataIndex: "stockName",
      key: "stockName",
      width: 140,
    },
    {
      title: "首次价格",
      dataIndex: "firstPrice",
      key: "firstPrice",
      width: 100,
      render: (val: number) => val.toFixed(2),
    },
    {
      title: "最新价格",
      dataIndex: "lastPrice",
      key: "lastPrice",
      width: 100,
      render: (val: number) => val.toFixed(2),
    },
    {
      title: "出现次数",
      dataIndex: "count",
      key: "count",
      width: 100,
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: "descend" as SortOrder,
    },
    {
      title: "涨跌幅",
      key: "change",
      width: 120,
      render: (_, record) => {
        const { firstPrice, lastPrice } = record
        if (!firstPrice) {
          return <Typography.Text type="secondary">—</Typography.Text>
        }
        const change = ((lastPrice - firstPrice) / firstPrice) * 100
        const color = getChangeHex(change, convention)
        return (
          <Typography.Text strong style={{ color }}>
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </Typography.Text>
        )
      },
    },
  ]

  const renderWordCloud = (
    words: Array<{ text: string; value: number }>,
    width: number,
  ) => {
    if (words.length === 0) {
      return (
        <Flex
          align="center"
          justify="center"
          style={{ height: 200, color: "#999" }}
        >
          暂无数据
        </Flex>
      )
    }
    return (
      <WordCloud
        data={words}
        width={width}
        height={200}
        fontSize={fontSizeMapper}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="数据分析"
        subtitle="基于最近 10 个交易日的股票记录做聚合"
      />
      <div style={{ padding: screens.md ? "24px 32px" : "16px" }}>
        <Spin spinning={loading}>
          <Flex vertical gap="middle">
            <Flex gap="middle" wrap>
              <Card style={{ flex: 1, minWidth: 160 }}>
                <Statistic
                  title="总记录数"
                  value={summary.total}
                  prefix={<StockOutlined />}
                />
              </Card>
              <Card style={{ flex: 1, minWidth: 160 }}>
                <Statistic title="出现过的股票" value={summary.unique} />
              </Card>
              <Card style={{ flex: 1, minWidth: 160 }}>
                <Statistic
                  title="行业种类"
                  value={summary.industries}
                  prefix={<FundOutlined />}
                />
              </Card>
              <Card style={{ flex: 1, minWidth: 160 }}>
                <Statistic
                  title="概念种类"
                  value={summary.notions}
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Flex>

            <Card title="频繁出现的股票" styles={{ body: { padding: 0 } }}>
              <Table<AnalyzedStock>
                dataSource={analyzedData}
                columns={columns}
                size="middle"
                scroll={{ x: true }}
                pagination={{ pageSize: 10 }}
                rowKey="key"
              />
            </Card>

            <Flex gap="middle" wrap>
              <Card
                title="行业词云"
                style={{ flex: 1, minWidth: screens.xs ? 320 : 460 }}
              >
                {renderWordCloud(industryWords, screens.xs ? 280 : 400)}
              </Card>
              <Card
                title="概念词云"
                style={{ flex: 1, minWidth: screens.xs ? 320 : 460 }}
              >
                {renderWordCloud(notionWords, screens.xs ? 280 : 400)}
              </Card>
            </Flex>
          </Flex>
        </Spin>
      </div>
    </div>
  )
}