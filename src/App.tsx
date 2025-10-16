import { Button, Flex, Modal, Table } from "antd"
import { useEffect, useRef, useState } from "react"
import { Editor, type EditorMethods } from "./components"
import type { Stock } from "./type"

import "./index.css"

function App() {
  const [showModal, setShowModal] = useState(false)
  const [data, setData] = useState<Stock[]>([])

  const editorRef = useRef<EditorMethods>(null)

  const closeModal = () => {
    setShowModal(false)
  }

  const fetchData = async () => {
    setData([])
    const username = "alazypig"
    const repoName = "edward-stock"

    const res = await fetch(
      `https://raw.githubusercontent.com/${username}/${repoName}/main/data/stock.json`,
    )

    const data = await res.json()

    setData(data.stockData)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div
      style={{
        backgroundColor: "#c6c6c6",
        width: "100svw",
        height: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{ width: "80svw", height: "80svh", backgroundColor: "#c6c6c6" }}
      >
        <Table
          style={{ width: "100%" }}
          dataSource={data}
          columns={[
            {
              title: "日期",
              dataIndex: "date",
              key: "date",
            },
            {
              title: "股票号码",
              dataIndex: "stockNumber",
              key: "stockNumber",
            },
            {
              title: "股票名称",
              dataIndex: "stockName",
              key: "stockName",
            },
            {
              title: "收盘价",
              dataIndex: "price",
              key: "price",
            },
            {
              title: "行业",
              dataIndex: "industry",
              key: "industry",
              render: (val: string[]) => {
                return val.join(",")
              },
            },
            {
              title: "概念",
              dataIndex: "notion",
              key: "notion",
              render: (val: string[]) => {
                return val.join(",")
              },
            },
            {
              title: "预测走势",
              dataIndex: "future",
              key: "future",
              render: (val: Stock["future"]) => {
                if (val === "long") {
                  return "上涨"
                } else if (val === "short") {
                  return "下跌"
                } else {
                  return "未知"
                }
              },
            },
            {
              title: "备注",
              dataIndex: "comment",
              key: "comment",
            },
          ]}
        />
      </div>

      <Flex>
        <Button
          style={{ marginRight: 16 }}
          type="default"
          onClick={() => {
            fetchData()
          }}
        >
          Refresh
        </Button>

        <Button
          type="primary"
          onClick={() => {
            editorRef.current?.clearFields()

            setShowModal(true)
          }}
        >
          Add New
        </Button>
      </Flex>

      <Modal open={showModal} onCancel={closeModal} footer={null}>
        <Editor ref={editorRef} closeModal={closeModal} />
      </Modal>
    </div>
  )
}

export default App
