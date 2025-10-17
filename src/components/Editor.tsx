import { Button, DatePicker, Flex, Grid, Input, message, Radio } from "antd"
import dayjs from "dayjs"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import type { Stock } from "../type"
import { TagInput } from "./TagInput"

const { useBreakpoint } = Grid

export interface EditorMethods {
  clearFields: () => void
}

interface Props {
  stockToEdit?: Stock | null
  onSave: (item: Stock) => void
  onCancel: () => void
}

export const Editor = forwardRef<EditorMethods, Props>(
  ({ stockToEdit, onSave, onCancel }, ref) => {
    const [date, setDate] = useState("")
    const [stockNumber, setStockNumber] = useState("")
    const [stockName, setStockName] = useState("")
    const [price, setPrice] = useState("")
    const [future, setFuture] = useState<"long" | "short" | "none">("none")
    const [comment, setComment] = useState("")

    const [industry, setIndustry] = useState<string[]>([])
    const [notion, setNotion] = useState<string[]>([])

    const [messageApi, contextHolder] = message.useMessage()
    const screens = useBreakpoint()

    useEffect(() => {
      if (stockToEdit) {
        setDate(stockToEdit.date || "")
        setStockNumber(stockToEdit.stockNumber || "")
        setStockName(stockToEdit.stockName || "")
        setPrice(
          stockToEdit.price !== undefined ? String(stockToEdit.price) : "",
        )
        setFuture(stockToEdit.future || "none")
        setComment(stockToEdit.comment || "")
        setIndustry(stockToEdit.industry || [])
        setNotion(stockToEdit.notion || [])
      } else {
        clearFields()
      }
    }, [stockToEdit])

    const clearFields = () => {
      // setDate("");
      setStockNumber("")
      setStockName("")
      setPrice("")
      setFuture("none")
      setComment("")
      setIndustry([])
      setNotion([])
    }

    const handleSave = () => {
      if (
        !date ||
        !stockNumber ||
        !stockName ||
        industry.length === 0 ||
        notion.length === 0
      ) {
        messageApi.error("Please fill in all required fields.")
        return
      }

      const priceNum = Number(price)

      if (isNaN(priceNum)) {
        messageApi.error("Please enter a valid price.")
        return
      }

      const item: Stock = {
        uuid: stockToEdit?.uuid ?? uuidv4(),
        date,
        stockNumber,
        stockName,
        price: priceNum,
        future,
        comment,
        industry,
        notion,
      }

      onSave(item)
      clearFields()
    }

    useImperativeHandle(ref, () => ({
      clearFields,
    }))

    return (
      <div
        style={{
          marginTop: 24,
        }}
      >
        {contextHolder}
        <Flex vertical gap={screens.md ? "middle" : "small"}>
          <DatePicker
            value={date ? dayjs(date) : null}
            onChange={(v) => {
              setDate(v ? v.format("YYYY-MM-DD") : "")
            }}
            style={{
              width: "100%",
            }}
          />

          <Flex vertical={!screens.md} gap="middle">
            <Input
              style={{ flex: 1 }}
              placeholder="Stock Number"
              value={stockNumber}
              onChange={(e) => {
                setStockNumber(e.target.value)
              }}
            />
            <Input
              style={{ flex: 1 }}
              placeholder="Stock Name"
              value={stockName}
              onChange={(e) => {
                setStockName(e.target.value)
              }}
            />
          </Flex>

          <Input
            placeholder="Price"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value)
            }}
          />

          <TagInput
            label="行业"
            initialValue={industry}
            onChange={setIndustry}
          />

          <TagInput label="概念" initialValue={notion} onChange={setNotion} />

          <Radio.Group
            value={future}
            options={[
              { label: "Long", value: "long" },
              { label: "Short", value: "short" },
              { label: "unknown", value: "none" },
            ]}
            optionType="button"
            buttonStyle="solid"
            onChange={(e) => {
              setFuture(e.target.value)
            }}
          />

          <Input
            placeholder="Comment"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value)
            }}
          />
        </Flex>

        <Flex
          style={{
            width: "100%",
            marginTop: 24,
          }}
        >
          <Button
            style={{
              flex: 1,
            }}
            onClick={() => {
              clearFields()
              onCancel()
            }}
          >
            Cancel
          </Button>
          <div style={{ width: 16 }}></div>
          <Button style={{ flex: 1 }} type="primary" onClick={handleSave}>
            Save
          </Button>
        </Flex>
      </div>
    )
  },
)

