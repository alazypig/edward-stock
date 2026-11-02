import { Tooltip, Typography } from "antd"
import type { Valuation } from "../type"
import {
  getValuationBand,
  getValuationColor,
  VALUATION_BAND_LABELS,
  VALUATION_LEVELS,
} from "../utils/valuation"

interface Props {
  valuation?: Valuation
  price: number
}

/**
 * 估值区间展示：单元格显示中性区间，低于中性下限标红、高于中性上限标黄；
 * hover 展示三档估值，并标出当前股价所在区间。没有估值时只显示 “—”。
 */
export const ValuationCell = ({ valuation, price }: Props) => {
  if (!valuation) {
    return <Typography.Text type="secondary">—</Typography.Text>
  }

  const color = getValuationColor(price, valuation)
  const band = getValuationBand(price, valuation)
  const { neutral } = valuation

  const title = (
    <div style={{ minWidth: 150, fontSize: 12, lineHeight: 1.9 }}>
      {VALUATION_LEVELS.map(({ key, label }) => {
        const range = valuation[key]
        const active = band === key
        return (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              fontWeight: active ? 600 : 400,
              color: active ? "#fff" : "rgba(255, 255, 255, 0.82)",
            }}
          >
            <span>
              {active ? "● " : ""}
              {label}
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {range.min.toFixed(2)} - {range.max.toFixed(2)}
            </span>
          </div>
        )
      })}
      <div
        style={{
          marginTop: 4,
          paddingTop: 4,
          borderTop: "1px solid rgba(255, 255, 255, 0.25)",
          color: color ?? "rgba(255, 255, 255, 0.82)",
        }}
      >
        当前价 {price.toFixed(2)} · {VALUATION_BAND_LABELS[band]}
      </div>
    </div>
  )

  return (
    <Tooltip title={title} placement="top">
      <span
        style={{
          color,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          cursor: "help",
          borderBottom: color ? `1px dashed ${color}` : undefined,
        }}
      >
        {neutral.min.toFixed(2)} - {neutral.max.toFixed(2)}
      </span>
    </Tooltip>
  )
}
