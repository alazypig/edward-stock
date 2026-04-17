import { ArrowLeftOutlined } from "@ant-design/icons"
import {
  Affix,
  Button,
  Card,
  Flex,
  Grid,
  Input,
  List,
  message,
  Modal,
  Table,
  Tag,
  Typography,
} from "antd"
import { useEffect, useRef, useState } from "react"
import { useBlocker, useNavigate } from "react-router-dom"
import { Editor, type EditorMethods } from "../components"
import type { GitHubFile, Stock } from "../type"

const { useBreakpoint } = Grid

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
  const screens = useBreakpoint()
  const navigate = useNavigate()
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [nextLocation, setNextLocation] = useState<string | null>(null)

  useBlocker((tx) => {
    if (newStocks.length > 0) {
      setNextLocation(tx.nextLocation.pathname)
      setShowLeaveConfirm(true)
      return true // Block navigation
    }
    return false // Allow navigation
  })

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log("newStocks.length:", newStocks.length)
      if (newStocks.length > 0) {
        event.preventDefault() // For some browsers
        return "您有未保存的更改。确定要离开吗？" // For other browsers
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [newStocks])

  useEffect(() => {
    if (!showLeaveConfirm && nextLocation) {
      navigate(nextLocation)
      setNextLocation(null) // Clear nextLocation after navigation
    }
  }, [showLeaveConfirm, nextLocation, navigate])

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
      
      localStorage.setItem("github_token", token)

      // 1. Group new stocks by month
      const groupedNewStocks: Record<string, Stock[]> = {}
      newStocks.forEach(stock => {
        const month = stock.date.substring(0, 7)
        if (!groupedNewStocks[month]) {
          groupedNewStocks[month] = []
        }
        groupedNewStocks[month].push(stock)
      })

      // 2. Fetch index.json
      const indexRes = await fetch(
        `https://api.github.com/repos/${username}/${repoName}/contents/data/index.json`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      let indexFile: GitHubFile | null = null
      let currentIndices: string[] = []
      if (indexRes.ok) {
        indexFile = await indexRes.json()
        const indexData = JSON.parse(decodeURIComponent(escape(atob(indexFile!.content))))
        currentIndices = indexData.files || []
      }

      let indexUpdated = false

      // 3. Process each month
      for (const month of Object.keys(groupedNewStocks)) {
        const fileName = `${month}.json`
        const filePath = `data/${fileName}`
        
        // Fetch existing data for this month
        const fileRes = await fetch(
          `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        let oldData: Stock[] = []
        let sha: string | undefined = undefined

        if (fileRes.ok) {
          const file: GitHubFile = await fileRes.json()
          oldData = JSON.parse(decodeURIComponent(escape(atob(file.content)))).stockData ?? []
          sha = file.sha
        }

        const monthNewStocks = groupedNewStocks[month]
        const newStockKeys = new Set(
          monthNewStocks.map((stock) => `${stock.date}|${stock.stockNumber}`),
        )

        const filteredOldData = oldData.filter(
          (stock) => !newStockKeys.has(`${stock.date}|${stock.stockNumber}`),
        )

        const newData = [...filteredOldData, ...monthNewStocks]
        const newContent = JSON.stringify({ stockData: newData }, null, 2)
        const encoded = btoa(unescape(encodeURIComponent(newContent)))

        // Push update for this month
        const putRes = await fetch(
          `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `Update stock data for ${month} from website`,
              content: encoded,
              sha,
            }),
          },
        )

        if (!putRes.ok) {
          const error = await putRes.json()
          throw new Error(`Failed to update ${fileName}: ${error.message}`)
        }

        if (!currentIndices.includes(fileName)) {
          currentIndices.push(fileName)
          indexUpdated = true
        }
      }

      // 4. Update index.json if needed
      if (indexUpdated || !indexFile) {
        currentIndices.sort().reverse()
        const newIndexContent = JSON.stringify({ files: currentIndices }, null, 2)
        const encodedIndex = btoa(unescape(encodeURIComponent(newIndexContent)))
        
        const putIndexRes = await fetch(
          `https://api.github.com/repos/${username}/${repoName}/contents/data/index.json`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `Update index.json from website`,
              content: encodedIndex,
              sha: indexFile?.sha,
            }),
          },
        )

        if (!putIndexRes.ok) {
          const error = await putIndexRes.json()
          throw new Error(`Failed to update index.json: ${error.message}`)
        }
      }

      messageApi.success("Stock data saved successfully.")
      setNewStocks([])
    } catch (error: any) {
      messageApi.error(error.message || "An unexpected error occurred.")
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

  const renderMobileList = () => (
    <List
      itemLayout="vertical"
      dataSource={newStocks}
      renderItem={(stock) => (
        <List.Item
          key={stock.uuid}
          actions={[
            <Button size="small" onClick={() => handleEdit(stock)}>
              Edit
            </Button>,
            <Button
              size="small"
              danger
              onClick={() => handleDelete(stock.uuid)}
            >
              Delete
            </Button>,
          ]}
        >
          <List.Item.Meta
            title={
              <Flex align="center" gap="small">
                <span>{`${stock.stockName} (${stock.stockNumber})`}</span>
                {stock.future === "long" && (
                  <span style={{ color: "green" }}>(Long)</span>
                )}
                {stock.future === "short" && (
                  <span style={{ color: "red" }}>(Short)</span>
                )}
              </Flex>
            }
            description={`Date: ${stock.date} | Price: ${stock.price}`}
          />
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Industry: </strong>
              {stock.industry.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
            <div>
              <strong>Notion: </strong>
              {stock.notion.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </div>
        </List.Item>
      )}
    />
  )

  const renderDesktopTable = () => (
    <Table dataSource={newStocks} columns={columns} rowKey="uuid" />
  )

  return (
    <div style={{ margin: screens.md ? "2rem" : "1rem" }}>
      {contextHolder}
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: "2rem" }}
      >
        <Typography.Title level={2} style={{ margin: 0 }}>
          Add New Stocks
        </Typography.Title>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            if (newStocks.length > 0) {
              setNextLocation("/")
              setShowLeaveConfirm(true)
            } else {
              navigate("/")
            }
          }}
        >
          Back to Home
        </Button>
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
        {screens.md ? renderDesktopTable() : renderMobileList()}
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

      <Modal
        title="确认离开"
        open={showLeaveConfirm}
        onCancel={() => setShowLeaveConfirm(false)}
        footer={[
          <Button key="back" onClick={() => setShowLeaveConfirm(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            onClick={() => {
              setNewStocks([]) // Discard changes
              setShowLeaveConfirm(false)
            }}
          >
            放弃更改并离开
          </Button>,
        ]}
      >
        <p>您有未保存的更改。确定要放弃更改并离开吗？</p>
      </Modal>
    </div>
  )
}
