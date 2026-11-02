import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons"
import {
  Button,
  DatePicker,
  Flex,
  Form,
  Grid,
  Input,
  InputNumber,
  Radio,
  Typography,
  message,
} from "antd"
import dayjs from "dayjs"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import type { Stock, Valuation, ValuationRange } from "../type"
import { VALUATION_LEVELS, type ValuationLevel } from "../utils/valuation"
import { TagInput } from "./TagInput"

const { useBreakpoint } = Grid

type RangeInput = { min: number | null; max: number | null }
type ValuationInput = Record<ValuationLevel, RangeInput>

const EMPTY_VALUATION_INPUT: ValuationInput = {
  conservative: { min: null, max: null },
  neutral: { min: null, max: null },
  optimistic: { min: null, max: null },
}

const toValuationInput = (valuation?: Valuation): ValuationInput => {
  if (!valuation) return EMPTY_VALUATION_INPUT
  return {
    conservative: {
      min: valuation.conservative.min,
      max: valuation.conservative.max,
    },
    neutral: { min: valuation.neutral.min, max: valuation.neutral.max },
    optimistic: {
      min: valuation.optimistic.min,
      max: valuation.optimistic.max,
    },
  }
}

export interface EditorMethods {
  clearFields: () => void
}

interface Props {
  stockToEdit?: Stock | null
  onSave: (item: Stock) => void
  onCancel: () => void
}

const futureOptions: Array<{
  label: string
  value: Stock["future"]
  icon?: React.ReactNode
}> = [
  { label: "上涨", value: "long", icon: <ArrowUpOutlined /> },
  { label: "下跌", value: "short", icon: <ArrowDownOutlined /> },
  { label: "未知", value: "none", icon: <QuestionCircleOutlined /> },
]

export const Editor = forwardRef<EditorMethods, Props>(
  ({ stockToEdit, onSave, onCancel }, ref) => {
    const [date, setDate] = useState("")
    const [stockNumber, setStockNumber] = useState("")
    const [stockName, setStockName] = useState("")
    const [price, setPrice] = useState<number | null>(null)
    const [future, setFuture] = useState<Stock["future"]>("none")
    const [comment, setComment] = useState("")

    const [industry, setIndustry] = useState<string[]>([])
    const [notion, setNotion] = useState<string[]>([])
    const [valuation, setValuation] = useState<ValuationInput>(
      EMPTY_VALUATION_INPUT,
    )

    const [messageApi, contextHolder] = message.useMessage()
    const screens = useBreakpoint()

    useEffect(() => {
      if (stockToEdit) {
        setDate(stockToEdit.date || "")
        setStockNumber(stockToEdit.stockNumber || "")
        setStockName(stockToEdit.stockName || "")
        setPrice(stockToEdit.price ?? null)
        setFuture(stockToEdit.future || "none")
        setComment(stockToEdit.comment || "")
        setIndustry(stockToEdit.industry || [])
        setNotion(stockToEdit.notion || [])
        setValuation(toValuationInput(stockToEdit.valuation))
      } else {
        clearFields()
      }
    }, [stockToEdit])

    const clearFields = () => {
      setStockNumber("")
      setStockName("")
      setPrice(null)
      setFuture("none")
      setComment("")
      setIndustry([])
      setNotion([])
      setValuation(EMPTY_VALUATION_INPUT)
    }

    const updateValuation = (
      level: ValuationLevel,
      field: "min" | "max",
      value: number | null,
    ) => {
      setValuation((prev) => ({
        ...prev,
        [level]: { ...prev[level], [field]: value },
      }))
    }

    useImperativeHandle(ref, () => ({ clearFields }), [])

    const handleSave = () => {
      if (!date) {
        messageApi.error("请选择日期")
        return
      }
      if (!stockNumber.trim()) {
        messageApi.error("请填写股票代码")
        return
      }
      if (!stockName.trim()) {
        messageApi.error("请填写股票名称")
        return
      }
      if (industry.length === 0) {
        messageApi.error("至少添加一个行业标签")
        return
      }
      if (notion.length === 0) {
        messageApi.error("至少添加一个概念标签")
        return
      }
      if (price === null || Number.isNaN(price) || price <= 0) {
        messageApi.error("请填写有效的收盘价")
        return
      }

      // 估值区间选填；只要填了任意一个数字，就要求三档上下限都完整且合法
      const hasValuationInput = VALUATION_LEVELS.some(
        ({ key }) => valuation[key].min !== null || valuation[key].max !== null,
      )
      let valuationData: Valuation | undefined
      if (hasValuationInput) {
        const ranges: Record<string, ValuationRange> = {}
        for (const { key, label } of VALUATION_LEVELS) {
          const { min, max } = valuation[key]
          if (min === null || max === null) {
            messageApi.error(`请填写完整的${label}估值下限和上限`)
            return
          }
          if (min > max) {
            messageApi.error(`${label}估值的下限不能大于上限`)
            return
          }
          ranges[key] = { min, max }
        }
        valuationData = {
          conservative: ranges.conservative,
          neutral: ranges.neutral,
          optimistic: ranges.optimistic,
        }
      }

      const item: Stock = {
        uuid: stockToEdit?.uuid ?? uuidv4(),
        date,
        stockNumber: stockNumber.trim(),
        stockName: stockName.trim(),
        price,
        future,
        comment: comment.trim(),
        industry,
        notion,
        valuation: valuationData,
      }

      onSave(item)
    }

    return (
      <div style={{ marginTop: 8 }}>
        {contextHolder}
        <Form layout="vertical" component={false}>
          <Form.Item label="日期" required>
            <DatePicker
              value={date ? dayjs(date) : null}
              onChange={(v) => setDate(v ? v.format("YYYY-MM-DD") : "")}
              format="YYYY-MM-DD"
              placeholder="选择观察日期"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Flex vertical={!screens.md} gap="middle">
            <Form.Item
              label="股票代码"
              required
              style={{ flex: 1, marginBottom: 0 }}
            >
              <Input
                placeholder="例如 600000"
                value={stockNumber}
                onChange={(e) => setStockNumber(e.target.value)}
              />
            </Form.Item>
            <Form.Item
              label="股票名称"
              required
              style={{ flex: 1, marginBottom: 0 }}
            >
              <Input
                placeholder="例如 浦发银行"
                value={stockName}
                onChange={(e) => setStockName(e.target.value)}
              />
            </Form.Item>
          </Flex>

          <Form.Item label="收盘价" required style={{ marginTop: 16 }}>
            <InputNumber
              placeholder="例如 12.34"
              value={price}
              onChange={(v) => setPrice(v ?? null)}
              min={0}
              step={0.01}
              precision={2}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="估值区间（选填）"
            extra="填了任意一个数字，就需要把保守 / 中性 / 乐观的上下限都填完整"
          >
            <Flex vertical gap="small">
              {VALUATION_LEVELS.map(({ key, label }) => (
                <Flex key={key} align="center" gap="small">
                  <Typography.Text
                    type="secondary"
                    style={{ width: 28, flexShrink: 0 }}
                  >
                    {label}
                  </Typography.Text>
                  <InputNumber
                    placeholder="下限"
                    value={valuation[key].min}
                    onChange={(v) => updateValuation(key, "min", v ?? null)}
                    min={0}
                    step={0.01}
                    precision={2}
                    style={{ flex: 1 }}
                  />
                  <Typography.Text type="secondary">-</Typography.Text>
                  <InputNumber
                    placeholder="上限"
                    value={valuation[key].max}
                    onChange={(v) => updateValuation(key, "max", v ?? null)}
                    min={0}
                    step={0.01}
                    precision={2}
                    style={{ flex: 1 }}
                  />
                </Flex>
              ))}
            </Flex>
          </Form.Item>

          <Form.Item label="行业" required>
            <TagInput
              label="+ 添加行业"
              initialValue={industry}
              onChange={setIndustry}
            />
          </Form.Item>

          <Form.Item label="概念" required>
            <TagInput
              label="+ 添加概念"
              initialValue={notion}
              onChange={setNotion}
            />
          </Form.Item>

          <Form.Item label="走势预测" required>
            <Radio.Group
              value={future}
              optionType="button"
              buttonStyle="solid"
              onChange={(e) => setFuture(e.target.value)}
              options={futureOptions}
            />
          </Form.Item>

          <Form.Item label="备注">
            <Input.TextArea
              placeholder="记录你看多或看跌的理由"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
        </Form>

        <Flex gap="small" style={{ marginTop: 8 }}>
          <Button style={{ flex: 1 }} onClick={onCancel}>
            取消
          </Button>
          <Button style={{ flex: 1 }} type="primary" onClick={handleSave}>
            保存
          </Button>
        </Flex>
      </div>
    )
  },
)
