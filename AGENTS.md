# edward-stock

Personal stock tracker (React 19 + Vite 7 + Ant Design 5 + TypeScript).

## Commands

```sh
npm run dev       # Vite dev server (port 5173)
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npm run preview   # vite preview
npm run format    # npx prettier --write .
```

Run `build` before commit — it does typecheck via `tsc -b`. No test framework exists.

## Conventions

- **Commit messages**: use English only, and use single quotes instead of double quotes (e.g. `fix: resolve 'xxx' bug`).
- **Language**: reply in Chinese when the user speaks Chinese.

## Architecture

- **Single-page app** with 4 lazy-loaded routes: Home (list), Add (input), Analysis (word clouds), CurrentPrice (live prices).
- **Data layer**: JSON files in `data/` committed to `alazypig/edward-stock` on GitHub. The app reads via `raw.githubusercontent.com` and writes via GitHub Contents API (needs a personal token in the Add page).
- **Data index**: `data/index.json` lists monthly files (e.g. `2026-06.json`). The app fetches the 3 most recent months.
- **Vite proxy** (dev only):
  - `/api` -> `hq.sinajs.cn` (rewrites `/api` away, sets `referer: finance.sina.com.cn`)
  - `/api/qt` -> `qt.gtimg.cn` (rewrites `/api/qt` away, sets `referer: stock.qq.com`)
- **State**: `StockDataContext` (React context) fetches all stock data on mount. `useStockData()` hook accesses it.

## Code style

- **Prettier**: `semi: false`, `singleQuote: false`, `trailingComma: "all"`, `printWidth: 80`
- **ESLint**: `@typescript-eslint/no-unused-vars` and `react-refresh/only-export-components` set to `warn`
- **Imports**: Use `import` with `.tsx`/`.ts` extensions (required by `verbatimModuleSyntax`)
- No tests, no CI, no PostCSS config (autoprefixer/postcss in package.json but unused).

## Important gotchas

- Stock data writes require a **GitHub personal token** with `repo` scope. The user pastes it in the Add page; it's stored in `localStorage`.
- CurrentPrice page fetches live data from Tencent's `qt.gtimg.cn` with GBK encoding (`FileReader` + `readAsText(blob, "gbk")`).
- Stock codes are prefixed with `sh` (Shanghai, starts with `6`) or `sz` (Shenzhen, starts with `0`/`3`) before querying live prices.
- The `Stock` type has `future: "long" | "short" | "none"` — these are Chinese stock predictions (上涨/下跌/未知).
