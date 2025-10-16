import { useEffect, useRef, useState } from "react"
import reactLogo from "./assets/react.svg"
import viteLogo from "/vite.svg"
import "./App.css"
import type { Stock } from "./type"
import { Editor, type EditorMethods } from "./components"
import { Button, Modal } from "antd"

function App() {
  const [showModal, setShowModal] = useState(false)
  const [data, setData] = useState<Stock[]>([])

  const editorRef = useRef<EditorMethods>(null)

  const closeModal = () => {
    setShowModal(false)
  }

  useEffect(() => {
    const fetchData = async () => {
      const username = "alazypig"
      const repoName = "edward-stock"

      const res = await fetch(
        `https://raw.githubusercontent.com/${username}/${repoName}/main/data/stock.json`,
      )

      const data = await res.json()

      setData(data)
    }

    fetchData()
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <Button
        type="primary"
        onClick={() => {
          editorRef.current?.clearFields()

          setShowModal(true)
        }}
      >
        Add New
      </Button>

      <Modal open={showModal} onCancel={closeModal} footer={null}>
        <Editor ref={editorRef} closeModal={closeModal} />
      </Modal>
    </>
  )
}

export default App
