import { useCallback, useEffect, useState, type ReactNode } from "react"
import {
  ColorConventionContext,
  type ColorConvention,
} from "./ColorConventionContext"

const STORAGE_KEY = "color_convention"
const DEFAULT: ColorConvention = "cn"

export const ColorConventionProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [convention, setConventionState] = useState<ColorConvention>(
    () =>
      (typeof window !== "undefined" &&
        (localStorage.getItem(STORAGE_KEY) as ColorConvention)) ||
      DEFAULT,
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, convention)
  }, [convention])

  const setConvention = useCallback((c: ColorConvention) => {
    setConventionState(c)
  }, [])

  return (
    <ColorConventionContext.Provider value={{ convention, setConvention }}>
      {children}
    </ColorConventionContext.Provider>
  )
}