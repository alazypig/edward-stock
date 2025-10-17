import { ArrowLeftOutlined } from "@ant-design/icons"
import {
  Affix,
  Button,
  Card,
  Flex,
  Input,
  message,
  Modal,
  Table,
  Typography,
} from "antd"
import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Editor, type EditorMethods } from "../components"
import type { GitHubFile, Stock } from "../type"

export const Add = () => {
  const [token, setToken] = useState(() => {
    const token = localStorage.getItem("github_token")
    return token ?? ""
  })
  const [newStocks, setNewStocks] = useState<Stock[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<Stock | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const editorRef = useRef<EditorMethods>(null)
  const [lastDate, setLastDate] = useState<string>(() => {
    return (
      localStorage.getItem("last_stock_date") ||
      new Date().toISOString().slice(0, 10)
    )
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = (item: Stock) => {
    if (item.date) {
      setLastDate(item.date)
      localStorage.setItem("last_stock_date", item.date)
    }
    if (editingStock?.uuid) {
      setNewStocks(
        newStocks.map((stock) => (stock.uuid === item.uuid ? item : stock)),
      )
    } else {
      setNewStocks([...newStocks, item])
    }
    setIsModalOpen(false)
    setEditingStock(null)
  }

  const handleDelete = (uuid: string) => {
    setNewStocks(newStocks.filter((stock) => stock.uuid !== uuid))
  }

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingStock({ date: lastDate } as Stock)
    setIsModalOpen(true)
  }

  const handleSubmitAll = async () => {
    if (newStocks.length === 0) {
      messageApi.error("No new stocks to submit.")
      return
    }

    setIsSubmitting(true)
    try {
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
      const oldData: Stock[] =
        JSON.parse(decodeURIComponent(escape(atob(file.content)))).stockData ??
        []

      const sha = file.sha

      const newStockKeys = new Set(
        newStocks.map((stock) => `${stock.date}|${stock.stockNumber}`),
      )

      const filteredOldData = oldData.filter(
        (stock) => !newStockKeys.has(`${stock.date}|${stock.stockNumber}`),
      )

      const newData = [...filteredOldData, ...newStocks]

      const newContent = JSON.stringify({ stockData: newData }, null, 2)
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
        const error = await putRes.json()
        messageApi.error(`Failed to update file: ${error.message}`)
        return
      }

      messageApi.success("Stock data saved successfully.")
      setNewStocks([])
    } catch (error) {
      messageApi.error("An unexpected error occurred.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    {
      title: "Stock Number",
      dataIndex: "stockNumber",
      key: "stockNumber",
      render: (text: string, record: Stock) => (
        <Flex align="center" gap="small">
          <span>{text}</span>
          {record.future === "long" && (
            <span style={{ color: "green" }}>(Long)</span>
          )}
          {record.future === "short" && (
            <span style={{ color: "red" }}>(Short)</span>
          )}
        </Flex>
      ),
    },
    { title: "Stock Name", dataIndex: "stockName", key: "stockName" },
    { title: "Price", dataIndex: "price", key: "price" },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, record: Stock) => (
        <Flex gap="small">
          <Button onClick={() => handleEdit(record)}>Edit</Button>
          <Button danger onClick={() => handleDelete(record.uuid)}>
            Delete
          </Button>
        </Flex>
      ),
    },
  ]

  return (
    <div style={{ margin: "2rem" }}>
      {contextHolder}
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: "2rem" }}
      >
        <Typography.Title level={2} style={{ margin: 0 }}>
          Add New Stocks
        </Typography.Title>
        <Link to="/">
          <Button icon={<ArrowLeftOutlined />}>Back to Home</Button>
        </Link>
      </Flex>

      <Card
        title="New Stocks"
        extra={
          <Button type="primary" onClick={handleAddNew}>
            Add New Stock
          </Button>
        }
        style={{ marginBottom: "2rem" }}
      >
        <Table dataSource={newStocks} columns={columns} rowKey="uuid" />
      </Card>

      <Affix offsetBottom={20}>
        <Card title="Submit to GitHub">
          <Flex vertical gap="middle">
            <Input
              placeholder="GitHub Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button
              type="primary"
              onClick={handleSubmitAll}
              loading={isSubmitting}
            >
              Submit All
            </Button>
          </Flex>
        </Card>
      </Affix>

      <Modal
        title={editingStock?.uuid ? "Edit Stock" : "Add New Stock"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingStock(null)
        }}
        footer={null}
        destroyOnClose
      >
        <Editor
          ref={editorRef}
          stockToEdit={editingStock}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingStock(null)
          }}
        />
      </Modal>
    </div>
  )
}
