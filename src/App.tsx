import {
  FundOutlined,
  LineChartOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons"
import { Flex, Layout, Menu, Segmented, Tooltip, Typography, theme } from "antd"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useColorConvention } from "./hooks/useColorConvention"
import type { ColorConvention } from "./contexts/ColorConventionContext"
import "./index.css"

const { Header, Content } = Layout

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()
  const { convention, setConvention } = useColorConvention()

  const items = [
    {
      key: "/",
      label: "股票列表",
      icon: <UnorderedListOutlined />,
    },
    {
      key: "/add",
      label: "添加记录",
      icon: <PlusOutlined />,
    },
    {
      key: "/analysis",
      label: "数据分析",
      icon: <FundOutlined />,
    },
    {
      key: "/current-price",
      label: "实时行情",
      icon: <LineChartOutlined />,
    },
  ]

  const selectedKey =
    items.find(
      (item) =>
        location.pathname === item.key ||
        (item.key !== "/" && location.pathname.startsWith(item.key)),
    )?.key ?? "/"

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          backgroundColor: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: 64,
          lineHeight: "64px",
        }}
      >
        <Flex align="center" style={{ height: "100%" }} gap="middle">
          <Typography.Title
            level={4}
            style={{ margin: 0, lineHeight: "64px" }}
          >
            📈 股票追踪
          </Typography.Title>
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            onClick={({ key }) => navigate(key)}
            items={items}
            style={{
              flex: 1,
              minWidth: 0,
              borderBottom: "none",
              background: "transparent",
            }}
          />
          <Tooltip
            title={
              convention === "cn"
                ? "当前：A 股惯例（红涨绿跌）"
                : "当前：国际惯例（绿涨红跌）"
            }
          >
            <Segmented
              size="small"
              value={convention}
              onChange={(v) => setConvention(v as ColorConvention)}
              options={[
                { label: "A股", value: "cn" },
                { label: "国际", value: "intl" },
              ]}
            />
          </Tooltip>
        </Flex>
      </Header>
      <Content style={{ backgroundColor: token.colorBgLayout }}>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default App