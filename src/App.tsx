import { Layout, theme } from "antd"
import { Outlet } from "react-router-dom"
import "./index.css"

function App() {
  const { token } = theme.useToken()

  return (
    <Layout
      style={{ minHeight: "100vh", backgroundColor: token.colorBgLayout }}
    >
      <Layout.Content>
        <Outlet />
      </Layout.Content>
    </Layout>
  )
}

export default App

