import { createContext } from "react"
import type { Stock } from "../type"

export interface StockDataContextType {
  stocks: Stock[]
  loading: boolean
  refetch: () => void
}

export const StockDataContext = createContext<StockDataContextType | undefined>(
  undefined,
)
