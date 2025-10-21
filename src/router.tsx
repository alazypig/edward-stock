import { lazy, Suspense } from "react"
import { createBrowserRouter } from "react-router-dom"
import App from "./App"
import { PageSpinner } from "./components/PageSpinner"

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

const CurrentPrice = lazy(() =>
  import("./pages/CurrentPrice").then((module) => ({
    default: module.CurrentPrice,
  })),
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
      {
        path: "current-price",
        element: (
          <Suspense fallback={<PageSpinner />}>
            <CurrentPrice />
          </Suspense>
        ),
      },
    ],
  },
])
