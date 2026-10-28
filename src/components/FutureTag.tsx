import { Tag } from "antd"
import { useColorConvention } from "../hooks/useColorConvention"
import type { Stock } from "../type"
import { getChangeSemantic } from "../utils/changeColor"

export const FutureTag = ({ future }: { future: Stock["future"] }) => {
  const { convention } = useColorConvention()
  if (future === "long") {
    return (
      <Tag color={getChangeSemantic(1, convention)} style={{ fontWeight: 600 }}>
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
