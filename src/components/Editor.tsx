import { Button, DatePicker, Divider, Flex, Input, message, Radio } from "antd"
import { v4 as uuidv4 } from "uuid"
import { forwardRef, useImperativeHandle, useState } from "react"
import type { GitHubFile, Stock } from "../type"
import { IndustryPart } from "./IndustryPart"
import { NotionPart } from "./NotionPart"
import { BorderlessTableOutlined } from "@ant-design/icons"

export interface EditorMethods {
  clearFields: () => void
}

interface Props {
  closeModal?: () => void
}

export const Editor = forwardRef(({ closeModal }: Props, ref) => {
  const [token, setToken] = useState(() => {
    const token = localStorage.getItem("github_token")

    return token ?? ""
  })
  const [date, setDate] = useState("")
  const [stockNumber, setStockNumber] = useState("")
  const [stockName, setStockName] = useState("")
  const [price, setPrice] = useState("")
  const [future, setFuture] = useState<"long" | "short" | "none">("none")
  const [comment, setComment] = useState("")

  const [industry, setIndustry] = useState<string[]>([])
  const [notion, setNotion] = useState<string[]>([])

  const [messageApi, contextHolder] = message.useMessage()

  const clearFields = () => {
    setDate("")
    setStockNumber("")
    setStockName("")
    setPrice("")
    setFuture("none")
    setComment("")
    setIndustry([])
    setNotion([])
  }

  const onSubmit = async () => {
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
      uuid: uuidv4(),
      date,
      stockNumber,
      stockName,
      price: priceNum,
      future,
      comment,
      industry,
      notion,
    }

    const username = "alazypig"
    const repoName = "edward-stock"

    const res = await fetch(
      `https://api.github.com/repos/${username}/${repoName}/contents/data/stock.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!res.ok) {
      const error = await res.json()
      messageApi.error(`Failed to fetch file: ${error.message}`)
      return
    }

    localStorage.setItem("github_token", token)

    const file: GitHubFile = await res.json()
    const oldData =
      JSON.parse(decodeURIComponent(escape(atob(file.content)))).stockData ?? []

    const sha = file.sha

    const newData = [...oldData, item]

    const newContent = JSON.stringify({ stockData: newData }, null, 0)
    const encoded = btoa(unescape(encodeURIComponent(newContent)))

    const putRes = await fetch(
      `https://api.github.com/repos/${username}/${repoName}/contents/data/stock.json`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Update stock data from website`,
          content: encoded,
          sha,
        }),
      },
    )

    if (!putRes.ok) {
      const error = await res.json()
      messageApi.error(`Failed to update file: ${error.message}`)
    }

    messageApi.success("Stock data saved successfully.")

    closeModal?.()
  }

  useImperativeHandle(ref, () => ({
    clearFields,
  }))

  return (
    <div
      style={{
        marginTop: 36,
      }}
    >
      {contextHolder}

      <Input
        placeholder="Token"
        value={token}
        onChange={(e) => {
          setToken(e.target.value)
        }}
      />

      <Divider size="middle" />

      <DatePicker
        onChange={(v) => {
          setDate(v.format("YYYY-MM-DD"))
        }}
        style={{
          width: "100%",
        }}
      />

      <Divider size="middle" />

      <Flex>
        <Input
          style={{ flex: 1 }}
          placeholder="Stock Number"
          value={stockNumber}
          onChange={(e) => {
            setStockNumber(e.target.value)
          }}
        />
        <div style={{ width: 16 }} />
        <Input
          style={{ flex: 1 }}
          placeholder="Stock Name"
          value={stockName}
          onChange={(e) => {
            setStockName(e.target.value)
          }}
        />
      </Flex>

      <Divider size="middle" />

      <Input
        placeholder="Price"
        value={price}
        onChange={(e) => {
          setPrice(e.target.value)
        }}
      />

      <Divider size="middle" />

      <IndustryPart initialValue={industry} onChange={setIndustry} />

      <Divider size="middle" />

      <NotionPart initialValue={notion} onChange={setNotion} />

      <Divider size="middle" />

      <Radio.Group
        value={future}
        block
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

      <Divider size="middle" />

      <Input
        placeholder="Comment"
        value={comment}
        onChange={(e) => {
          setComment(e.target.value)
        }}
      />

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
            closeModal?.()
          }}
        >
          Cancel
        </Button>
        <div style={{ width: 16 }}></div>
        <Button style={{ flex: 1 }} type="primary" onClick={onSubmit}>
          Submit
        </Button>
      </Flex>
    </div>
  )
})
