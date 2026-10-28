import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons"
import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Grid,
  Input,
  List,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useEffect, useRef, useState } from "react"
import { useBlocker, useNavigate } from "react-router-dom"
import {
  Editor,
  FutureTag,
  PageHeader,
  type EditorMethods,
} from "../components"
import {
  CONTENTS_API_BASE,
  INDEX_FILE,
  LAST_DATE_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
} from "../config"
import { useStockData } from "../hooks/useStockData"
import type { GitHubFile, Stock } from "../type"
import { decodeBase64Utf8, encodeBase64Utf8 } from "../utils/base64"

const { useBreakpoint } = Grid

export const Add = () => {
  const [token, setToken] = useState<string>(
    () => localStorage.getItem(TOKEN_STORAGE_KEY) ?? "",
  )
  const [newStocks, setNewStocks] = useState<Stock[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<Stock | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const editorRef = useRef<EditorMethods>(null)
  const [lastDate, setLastDate] = useState<string>(
    () =>
      localStorage.getItem(LAST_DATE_STORAGE_KEY) ||
      dayjs().format("YYYY-MM-DD"),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const screens = useBreakpoint()
  const navigate = useNavigate()
  const { refetch } = useStockData()

  // 有未提交记录时拦截路由跳转，交给确认弹窗决定 proceed / reset
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      newStocks.length > 0 &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (newStocks.length > 0) {
        event.preventDefault()
        event.returnValue = "您有未保存的更改，确定要离开吗？"
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [newStocks])

  const handleSave = (item: Stock) => {
    if (item.date) {
      setLastDate(item.date)
      localStorage.setItem(LAST_DATE_STORAGE_KEY, item.date)
    }
    if (editingStock?.uuid) {
      setNewStocks((prev) =>
        prev.map((stock) => (stock.uuid === item.uuid ? item : stock)),
      )
    } else {
      setNewStocks((prev) => [...prev, item])
    }
    setIsModalOpen(false)
    setEditingStock(null)
  }

  const handleDelete = (uuid: string) => {
    setNewStocks((prev) => prev.filter((stock) => stock.uuid !== uuid))
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
      messageApi.error("没有待提交的记录")
      return
    }
    if (!token) {
      messageApi.error("请先填写 GitHub Token")
      return
    }

    setIsSubmitting(true)
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)

      const groupedNewStocks: Record<string, Stock[]> = {}
      newStocks.forEach((stock) => {
        const month = stock.date.substring(0, 7)
        if (!groupedNewStocks[month]) {
          groupedNewStocks[month] = []
        }
        groupedNewStocks[month].push(stock)
      })

      const indexRes = await fetch(`${CONTENTS_API_BASE}/${INDEX_FILE}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      let indexFile: GitHubFile | null = null
      let currentIndices: string[] = []
      if (indexRes.ok) {
        const fetched = await indexRes.json()
        indexFile = fetched
        const indexData = JSON.parse(decodeBase64Utf8(fetched.content))
        currentIndices = indexData.files || []
      }

      let indexUpdated = false

      for (const month of Object.keys(groupedNewStocks)) {
        const fileName = `${month}.json`

        const fileRes = await fetch(`${CONTENTS_API_BASE}/${fileName}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        let oldData: Stock[] = []
        let sha: string | undefined = undefined

        if (fileRes.ok) {
          const file: GitHubFile = await fileRes.json()
          oldData = JSON.parse(decodeBase64Utf8(file.content)).stockData ?? []
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
        const encoded = encodeBase64Utf8(newContent)

        const putRes = await fetch(`${CONTENTS_API_BASE}/${fileName}`, {
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
        })

        if (!putRes.ok) {
          const error = (await putRes.json()) as { message?: string }
          throw new Error(
            `更新 ${fileName} 失败：${error.message ?? "未知错误"}`,
          )
        }

        if (!currentIndices.includes(fileName)) {
          currentIndices.push(fileName)
          indexUpdated = true
        }
      }

      if (indexUpdated || !indexFile) {
        currentIndices.sort().reverse()
        const newIndexContent = JSON.stringify(
          { files: currentIndices },
          null,
          2,
        )
        const encodedIndex = encodeBase64Utf8(newIndexContent)

        const putIndexRes = await fetch(`${CONTENTS_API_BASE}/${INDEX_FILE}`, {
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
        })

        if (!putIndexRes.ok) {
          const error = (await putIndexRes.json()) as { message?: string }
          throw new Error(
            `更新 index.json 失败：${error.message ?? "未知错误"}`,
          )
        }
      }

      messageApi.success("已成功保存到 GitHub")
      setNewStocks([])
      // raw.githubusercontent.com 有 CDN 缓存，强制刷新一次，避免列表仍是旧数据
      await refetch()
    } catch (error) {
      const msg = error instanceof Error ? error.message : "发生未知错误"
      messageApi.error(msg)
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: ColumnsType<Stock> = [
    { title: "日期", dataIndex: "date", key: "date", width: 110 },
    {
      title: "股票代码",
      dataIndex: "stockNumber",
      key: "stockNumber",
      width: 110,
    },
    {
      title: "股票名称",
      dataIndex: "stockName",
      key: "stockName",
      width: 140,
    },
    {
      title: "收盘价",
      dataIndex: "price",
      key: "price",
      width: 100,
    },
    {
      title: "走势",
      dataIndex: "future",
      key: "future",
      width: 80,
      render: (val: Stock["future"]) => <FutureTag future={val} />,
    },
    {
      title: "操作",
      key: "action",
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.uuid)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const renderEmpty = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Typography.Text type="secondary">还没有待提交的记录</Typography.Text>
      }
      style={{ padding: "32px 0" }}
    />
  )

  const renderMobileList = () => (
    <List
      dataSource={newStocks}
      locale={{ emptyText: renderEmpty }}
      renderItem={(stock) => (
        <List.Item
          key={stock.uuid}
          actions={[
            <Button
              key="edit"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(stock)}
            >
              编辑
            </Button>,
            <Button
              key="delete"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(stock.uuid)}
            >
              删除
            </Button>,
          ]}
        >
          <List.Item.Meta
            title={
              <Flex align="center" gap="small">
                <Typography.Text strong>
                  {stock.stockName}（{stock.stockNumber}）
                </Typography.Text>
                <FutureTag future={stock.future} />
              </Flex>
            }
            description={`${stock.date} · 收盘价 ${stock.price.toFixed(2)}`}
          />
          <Space size={[4, 4]} wrap style={{ marginTop: 8 }}>
            {stock.industry.map((tag) => (
              <Tag key={tag} color="blue">
                {tag}
              </Tag>
            ))}
            {stock.notion.map((tag) => (
              <Tag key={tag} color="purple">
                {tag}
              </Tag>
            ))}
          </Space>
        </List.Item>
      )}
    />
  )

  const renderDesktopTable = () => (
    <Table<Stock>
      dataSource={newStocks}
      columns={columns}
      rowKey="uuid"
      pagination={false}
      locale={{ emptyText: renderEmpty }}
    />
  )

  return (
    <div style={{ paddingBottom: 96 }}>
      {contextHolder}
      <PageHeader
        title="添加记录"
        subtitle={`编辑完成后点击「提交到 GitHub」写入仓库，共 ${newStocks.length} 条待提交`}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
            返回
          </Button>
        }
      />

      <div style={{ padding: screens.md ? "24px 32px" : "16px" }}>
        <Card
          title={
            <Flex
              align="center"
              justify="space-between"
              wrap="wrap"
              gap="small"
            >
              <Typography.Text strong>待提交列表</Typography.Text>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddNew}
              >
                新增一条
              </Button>
            </Flex>
          }
          styles={{ body: { padding: screens.md ? 16 : 8 } }}
          style={{ marginBottom: 16 }}
        >
          {screens.md ? renderDesktopTable() : renderMobileList()}
        </Card>

        <Card
          title={
            <Flex align="center" gap="small">
              <CloudUploadOutlined />
              <Typography.Text strong>提交到 GitHub</Typography.Text>
            </Flex>
          }
          styles={{ body: { padding: 16 } }}
        >
          <Flex vertical gap="middle">
            <Alert
              showIcon
              type="info"
              icon={<InfoCircleOutlined />}
              message="Token 仅保存在本地浏览器（localStorage），写入后会更新每月数据文件。"
              description={
                <Typography.Text type="secondary">
                  需要具备 <code>repo</code> 权限的 Personal Access Token。
                </Typography.Text>
              }
            />
            <Input.Password
              placeholder="GitHub Personal Access Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={isSubmitting}
              onClick={handleSubmitAll}
              disabled={newStocks.length === 0}
              block
            >
              {newStocks.length > 0
                ? `提交 ${newStocks.length} 条记录`
                : "提交到 GitHub"}
            </Button>
          </Flex>
        </Card>
      </div>

      <Modal
        title={editingStock?.uuid ? "编辑记录" : "新增记录"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingStock(null)
        }}
        footer={null}
        destroyOnHidden
        width={screens.md ? 640 : "calc(100vw - 32px)"}
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
        open={blocker.state === "blocked"}
        onCancel={() => blocker.reset?.()}
        okButtonProps={{ danger: true }}
        okText="放弃并离开"
        cancelText="继续编辑"
        onOk={() => blocker.proceed?.()}
      >
        <Typography.Paragraph>
          您有 <Typography.Text strong>{newStocks.length}</Typography.Text>{" "}
          条未提交的记录。确定要放弃这些更改并离开吗？
        </Typography.Paragraph>
      </Modal>
    </div>
  )
}
