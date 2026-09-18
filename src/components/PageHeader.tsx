import { Flex, Typography, theme } from "antd"
import type { CSSProperties, ReactNode } from "react"

interface Props {
  title: string
  subtitle?: string
  extra?: ReactNode
}

export const PageHeader = ({ title, subtitle, extra }: Props) => {
  const { token } = theme.useToken()

  const wrapperStyle: CSSProperties = {
    padding: "16px 32px",
    backgroundColor: token.colorBgContainer,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
  }

  return (
    <div style={wrapperStyle}>
      <Flex justify="space-between" align="center" gap="middle" wrap="wrap">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {subtitle ? (
            <Typography.Text
              type="secondary"
              style={{ display: "block", marginTop: 4 }}
            >
              {subtitle}
            </Typography.Text>
          ) : null}
        </div>
        {extra ? <Flex gap="small" wrap="wrap">{extra}</Flex> : null}
      </Flex>
    </div>
  )
}