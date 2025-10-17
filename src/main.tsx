import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { StockDataProvider } from "./contexts/StockDataContext"
import { router } from "./router"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StockDataProvider>
      <RouterProvider router={router} />
    </StockDataProvider>
  </StrictMode>,
)
