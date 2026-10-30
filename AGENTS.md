# edward-stock

Personal stock tracker (React 19 + Vite 7 + Ant Design 5 + TypeScript).

## Commands

```sh
pnpm install      # 包管理器为 pnpm（pnpm-lock.yaml 是唯一 lockfile）
pnpm dev          # Vite dev server (port 5173)
pnpm build        # tsc -b && vite build
pnpm lint         # eslint .
pnpm preview      # vite preview
pnpm format       # prettier --write .
```

Run `build` before commit — it does typecheck via `tsc -b`. No test framework exists.

## Conventions

- **Commit messages**: use English only, and use single quotes instead of double quotes (e.g. `fix: resolve 'xxx' bug`).
- **Language**: reply in Chinese when the user speaks Chinese.

## Architecture

- **Single-page app** with 4 lazy-loaded routes: Home (list), Add (input), Analysis (word clouds), CurrentPrice (live prices).
- **Data layer**: JSON files in `data/` committed to `alazypig/edward-stock` on GitHub. The app reads via `raw.githubusercontent.com` and writes via GitHub Contents API (needs a personal token in the Add page).
- **Data index**: `data/index.json` lists monthly files (e.g. `2026-06.json`), newest first. Full history is ~260 KB; the list page needs all of it.
- **Two data sources**:
  - `useStockData()` → `StockDataContext`: **lazy** full load (index + every month). Triggered on first consume (Home / Add / CurrentPrice), so visiting only `/analysis` never downloads the whole history.
  - `useRecentStocks(limit)` → `src/hooks/useRecentStocks.ts`: for the Analysis and CurrentPrice pages. Fetches monthly files newest-first and stops as soon as `limit` records are covered, then trims to **whole trading days** (`takeLatestWholeDays`): if the boundary day pushes past the limit, that day is kept entirely. Limit is `ANALYSIS_RECORD_LIMIT` (100) in `src/config.ts`.
- **Config**: GitHub owner/repo and localStorage keys live in `src/config.ts`; there are no Vite proxies (Tencent quote API allows CORS).
- **State**: `StockDataContext` (React context) + `useStockData()` hook. `refetch()` bypasses the raw.githubusercontent.com CDN cache with a `?t=` timestamp.
- **Base64**: use `decodeBase64Utf8` / `encodeBase64Utf8` in `src/utils/base64.ts` for GitHub Contents API payloads — never spread a whole file into `String.fromCharCode`.

## Code style

- **Prettier**: `semi: false`, `singleQuote: false`, `trailingComma: "all"`, `printWidth: 80`
- **ESLint**: `@typescript-eslint/no-unused-vars` and `react-refresh/only-export-components` set to `warn`
- **Imports**: Use `import` with `.tsx`/`.ts` extensions (required by `verbatimModuleSyntax`)
- No tests, no CI, no PostCSS config (autoprefixer/postcss in package.json but unused).

## Important gotchas

- Stock data writes require a **GitHub personal token** with `repo` scope. The user pastes it in the Add page; it's stored in `localStorage`.
- CurrentPrice page fetches live data from Tencent's `qt.gtimg.cn` with GBK encoding (`TextDecoder("gbk")`), parsing the `s_` shorthand quote format: field 6 is volume in 手, field 7 turnover in 万元, field 9 market cap in 亿元.
- Stock codes are prefixed with `sh` (Shanghai, starts with `6`) or `sz` (Shenzhen, starts with `0`/`3`) before querying live prices.
- Unsaved Add-page records block navigation via `useBlocker`; the confirm modal is driven by `blocker.state` (`proceed()` = discard & leave, `reset()` = stay).
- The `Stock` type has `future: "long" | "short" | "none"` — these are Chinese stock predictions (上涨/下跌/未知).
- **Never format `data/`**: `.prettierignore` excludes it on purpose. The app writes JSON with expanded arrays via `JSON.stringify(..., null, 2)`, so running Prettier over `data/` rewrites all monthly files for no reason (and stale formatting has already caused records from a newer commit to be reverted locally).
