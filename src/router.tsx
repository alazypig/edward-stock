import { Spin } from "antd"
import { lazy, Suspense } from "react"
import { createBrowserRouter } from "react-router-dom"
import App from "./App"

// Dynamically import pages
const Home = lazy(() =>
  import("./pages/Home").then((module) => ({ default: module.Home })),
)
const Add = lazy(() =>
  import("./pages/Add").then((module) => ({ default: module.Add })),
)
const Analysis = lazy(() =>
  import("./pages/Analysis").then((module) => ({ default: module.Analysis })),
)

// A simple spinner component for the fallback
const PageSpinner = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    <Spin size="large" />
  </div>
)

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageSpinner />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: "add",
        element: (
          <Suspense fallback={<PageSpinner />}>
            <Add />
          </Suspense>
        ),
      },
      {
        path: "analysis",
        element: (
          <Suspense fallback={<PageSpinner />}>
            <Analysis />
          </Suspense>
        ),
      },
    ],
  },
])

