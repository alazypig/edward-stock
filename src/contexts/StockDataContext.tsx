import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import type { Stock } from "../type";

interface StockDataContextType {
  stocks: Stock[];
  loading: boolean;
  refetch: () => void;
}

const StockDataContext = createContext<StockDataContextType | undefined>(
  undefined
);

export const StockDataProvider = ({ children }: { children: ReactNode }) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const username = "alazypig";
      const repoName = "edward-stock";
      const res = await fetch(
        `https://raw.githubusercontent.com/${username}/${repoName}/main/data/stock.json`
      );
      const data = await res.json();
      setStocks(data.stockData || []);
    } catch (error) {
      console.error("Failed to fetch stock data", error);
      setStocks([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const value = {
    stocks,
    loading,
    refetch: fetchData,
  };

  return (
    <StockDataContext.Provider value={value}>
      {children}
    </StockDataContext.Provider>
  );
};

export const useStockData = () => {
  const context = useContext(StockDataContext);
  if (context === undefined) {
    throw new Error("useStockData must be used within a StockDataProvider");
  }
  return context;
};
