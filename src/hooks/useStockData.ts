import { useContext } from "react";
import { StockDataContext } from "../contexts/StockDataContext";

export const useStockData = () => {
  const context = useContext(StockDataContext);
  if (context === undefined) {
    throw new Error("useStockData must be used within a StockDataProvider");
  }
  return context;
};
