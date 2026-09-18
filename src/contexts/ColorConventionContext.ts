import { createContext } from "react"

export type ColorConvention = "cn" | "intl"

export interface ColorConventionContextType {
  convention: ColorConvention
  setConvention: (c: ColorConvention) => void
}

export const ColorConventionContext = createContext<
  ColorConventionContextType | undefined
>(undefined)