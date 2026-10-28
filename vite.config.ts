import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // antd 打进来后单个共享 chunk 约 650 KB，属于预期体积
    chunkSizeWarningLimit: 1000,
    // 不要手写 manualChunks：按路径分组会让 vendor chunk 互相 import
    // （vendor-react -> vendor -> vendor-antd -> vendor-react），
    // 生产环境会报 "Cannot read properties of undefined (reading 'createContext')"。
    // Rollup 默认的分包策略会自动打破循环，这里保持默认。
  },
})
