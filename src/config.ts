const GITHUB_USERNAME = "alazypig"
const GITHUB_REPO = "edward-stock"
const GITHUB_BRANCH = "main"

/** raw.githubusercontent.com 读取前缀（只读、走 CDN） */
export const RAW_DATA_BASE = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${GITHUB_BRANCH}/data`

/** GitHub Contents API 读取/写入前缀（需要 token） */
export const CONTENTS_API_BASE = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/data`

export const INDEX_FILE = "index.json"

/** 分析页只取最近 100 条记录（按交易日整日取整），不下载全部历史 */
export const ANALYSIS_RECORD_LIMIT = 100

export const TOKEN_STORAGE_KEY = "github_token"
export const LAST_DATE_STORAGE_KEY = "last_stock_date"
