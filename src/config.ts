const GITHUB_USERNAME = "alazypig"
const GITHUB_REPO = "edward-stock"

/**
 * 分支划分：
 * - `main` 只放代码，Cloudflare Pages 只在它上面构建部署；
 * - `data` 只放 data/*.json，网页上的写入全部落在这一支，不触发部署。
 */
export const DATA_BRANCH = "data"

/** raw.githubusercontent.com 读取前缀（数据分支、只读、走 CDN） */
export const RAW_DATA_BASE = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${DATA_BRANCH}/data`

/** GitHub Contents API 读取/写入前缀（需要 token） */
export const CONTENTS_API_BASE = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/data`

/** Contents API 读取数据文件时需要指定分支 */
export const DATA_REF_QUERY = `?ref=${DATA_BRANCH}`

/** 数据提交信息后缀，Cloudflare Pages 看到它会跳过该次构建 */
export const SKIP_CI_SUFFIX = " [skip ci]"

export const INDEX_FILE = "index.json"

/** 分析页只取最近 100 条记录（按交易日整日取整），不下载全部历史 */
export const ANALYSIS_RECORD_LIMIT = 100

export const TOKEN_STORAGE_KEY = "github_token"
export const LAST_DATE_STORAGE_KEY = "last_stock_date"
