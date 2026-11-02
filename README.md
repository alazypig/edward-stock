# 股票追踪（edward-stock）

个人 A 股观察 / 复盘工具。纯前端，无后端：数据以 JSON 文件形式存放在 GitHub 仓库
`alazypig/edward-stock` 的 `data/` 目录，浏览器直接读写该仓库。

## 功能

| 页面     | 路径             | 说明                                                                       |
| -------- | ---------------- | -------------------------------------------------------------------------- |
| 股票列表 | `/`              | 全部历史记录，支持按代码 / 名称 / 行业 / 概念 / 备注搜索；展示估值区间     |
| 添加记录 | `/add`           | 批量录入、编辑、删除（含三档估值），一次性提交到 GitHub                    |
| 数据分析 | `/analysis`      | 最近 100 条记录（按交易日整日取整）聚合：涨跌幅、词云                      |
| 实时行情 | `/current-price` | 最近 100 条记录中出现过的股票实时报价，默认涨得最多在前，点表头切换升/降序 |

右上角可切换 **A 股惯例（红涨绿跌）/ 国际惯例（绿涨红跌）**，选择保存在 localStorage。

## 技术栈

- React 19 + TypeScript 5.9（strict）+ Vite 7
- Ant Design 5（表格 / 表单 / 响应式）
- react-router-dom 7（`createBrowserRouter` + 页面懒加载）
- d3-cloud / react-d3-cloud（词云）、dayjs、uuid

## 开发

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint
npm run format
```

## 数据存储

数据放在 **`data` 分支**（`main` 只放代码），目录结构：

```
data/                     # data 分支根目录
├── index.json      # { "files": ["2026-10.json", "2026-09.json", ...] }  新→旧
├── 2026-10.json    # { "stockData": [Stock, ...] }
└── ...
```

这样的好处：网页上新增 / 修改记录只产生 `data` 分支的提交，`main` 不动，
Cloudflare Pages 也就不会因为数据变更而重新编译部署。

单条记录：

```json
{
  "uuid": "…",
  "date": "2026-10-16",
  "stockNumber": "600072",
  "stockName": "中船科技",
  "price": 10,
  "industry": ["风电设备"],
  "notion": ["国产航母", "风电"],
  "future": "long",
  "comment": "距底部不高",
  "valuation": {
    "conservative": { "min": 3.01, "max": 3.77 },
    "neutral": { "min": 4.52, "max": 5.27 },
    "optimistic": { "min": 6.03, "max": 7.53 }
  }
}
```

- **读取**：`raw.githubusercontent.com/alazypig/edward-stock/data/data/...`，输出走 CDN；刷新时带时间戳参数绕过缓存。
- **按需加载**：列表页需要全量历史，首次使用时才懒加载；分析页只要最近 100 条
  （`ANALYSIS_RECORD_LIMIT`），从最新月份往前逐月下载，凑够 100 条即停止，
  并按交易日整日取整（边界那天超了也整日保留）。
- **写入**：GitHub Contents API，需要 `repo` 权限的 Personal Access Token（在「添加记录」页填写，仅存 localStorage）。
  读取和写入都带 `data` 分支（`?ref=data` / `branch: "data"`），提交信息带 `[skip ci]`。
  写入按 `日期|股票代码` 去重，新增月份会自动登记进 `index.json`。
- **估值区间（选填）**：`valuation` 保存保守 / 中性 / 乐观三档价格的上下限。列表和待提交
  列表显示中性区间：收盘价低于中性下限标 **红**，高于中性上限标 **黄**；hover 展示三档
  区间并标出当前股价所处档位。没有估值时显示 `—`，不显示悬浮层。
  填写规则：要么六个数字都不填，要么六个数都填且每档下限 ≤ 上限。

## 目录结构

```
src/
├── config.ts              GitHub 仓库地址、localStorage key
├── type.ts                Stock / GitHubFile
├── router.tsx             路由表（懒加载）
├── App.tsx                全局布局与颜色惯例切换
├── contexts/              StockData（数据）、ColorConvention（红绿惯例）
├── hooks/                 useStockData / useColorConvention / useAnalysisData
├── components/            Editor、TagInput、FutureTag、PageHeader、PageSpinner
├── pages/                 Home / Add / Analysis / CurrentPrice
└── utils/                 changeColor（涨跌配色）、base64（GitHub 编解码）
```

## 注意事项

- 实时行情来自腾讯 `qt.gtimg.cn`，GBK 编码，必须在浏览器端用 `TextDecoder("gbk")` 解码。
- 股票代码在查询前会补市场前缀：`6` 开头 → `sh`，`0`/`3` 开头 → `sz`。
- 暂无测试与 CI；提交前请执行 `npm run build`（包含类型检查）。
