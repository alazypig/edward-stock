import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { ColorConventionProvider } from "./contexts/ColorConventionContext.tsx"
import { StockDataProvider } from "./contexts/StockDataContext.tsx"
import { router } from "./router"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColorConventionProvider>
      <StockDataProvider>
        <RouterProvider router={router} />
      </StockDataProvider>
    </ColorConventionProvider>
  </StrictMode>,
)
