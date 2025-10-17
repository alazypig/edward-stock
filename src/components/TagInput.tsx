import { PlusOutlined } from "@ant-design/icons"
import { Flex, Input, Tag, theme, Tooltip, type InputRef } from "antd"
import { useEffect, useRef, useState } from "react"

interface Props {
  label: string
  initialValue?: string[]
  onChange?: (tags: string[]) => void
}

export const TagInput = ({ label, initialValue = [], onChange }: Props) => {
  const [tags, setTags] = useState<string[]>(initialValue)
  const [inputVisible, setInputVisible] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [editInputIndex, setEditInputIndex] = useState(-1)
  const [editInputValue, setEditInputValue] = useState("")
  const inputRef = useRef<InputRef>(null)
  const editInputRef = useRef<InputRef>(null)
  const { token: styleToken } = theme.useToken()

  useEffect(() => {
    if (inputVisible) {
      inputRef.current?.focus()
    }
  }, [inputVisible])

  useEffect(() => {
    editInputRef.current?.focus()
  }, [editInputValue])

  useEffect(() => {
    setTags(initialValue)
  }, [initialValue])

  const handleClose = (removedTag: string) => {
    const newTags = tags.filter((tag) => tag !== removedTag)
    setTags(newTags)
    if (onChange) {
      onChange(newTags)
    }
  }

  const showInput = () => {
    setInputVisible(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputConfirm = () => {
    if (inputValue && !tags.includes(inputValue)) {
      const newTags = [...tags, inputValue]
      setTags(newTags)
      if (onChange) {
        onChange(newTags)
      }
    }
    setInputVisible(false)
    setInputValue("")
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditInputValue(e.target.value)
  }

  const handleEditInputConfirm = () => {
    const newTags = [...tags]
    newTags[editInputIndex] = editInputValue
    setTags(newTags)
    if (onChange) {
      onChange(newTags)
    }
    setEditInputIndex(-1)
    setEditInputValue("")
  }

  const tagInputStyle: React.CSSProperties = {
    width: 64,
    height: 22,
    marginInlineEnd: 8,
    verticalAlign: "top",
  }

  const tagPlusStyle: React.CSSProperties = {
    height: 22,
    background: styleToken.colorBgContainer,
    borderStyle: "dashed",
  }

  return (
    <Flex
      gap="4px 0"
      wrap
      style={{
        borderRadius: 8,
        padding: 12,
        border: "1px dashed #666",
      }}
    >
      {tags.map<React.ReactNode>((tag, index) => {
        if (editInputIndex === index) {
          return (
            <Input
              ref={editInputRef}
              key={tag}
              size="small"
              style={tagInputStyle}
              value={editInputValue}
              onChange={handleEditInputChange}
              onBlur={handleEditInputConfirm}
              onPressEnter={handleEditInputConfirm}
            />
          )
        }
        const isLongTag = tag.length > 20
        const tagElem = (
          <Tag
            key={tag}
            closable
            style={{ userSelect: "none" }}
            onClose={() => handleClose(tag)}
          >
            <span
              onDoubleClick={(e) => {
                if (index !== 0) {
                  setEditInputIndex(index)
                  setEditInputValue(tag)
                  e.preventDefault()
                }
              }}
            >
              {isLongTag ? `${tag.slice(0, 20)}...` : tag}
            </span>
          </Tag>
        )
        return isLongTag ? (
          <Tooltip title={tag} key={tag}>
            {tagElem}
          </Tooltip>
        ) : (
          tagElem
        )
      })}
      {inputVisible ? (
        <Input
          ref={inputRef}
          type="text"
          size="small"
          style={tagInputStyle}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
        />
      ) : (
        <Tag style={tagPlusStyle} icon={<PlusOutlined />} onClick={showInput}>
          {label}
        </Tag>
      )}
    </Flex>
  )
}
