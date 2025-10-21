import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://hq.sinajs.cn",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        headers: {
          referer: "https://finance.sina.com.cn/",
        },
      },
      "/api/qt": {
        target: "http://qt.gtimg.cn",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/qt/, ""),
        headers: {
          referer: "https://stock.qq.com/",
        },
      },
    },
  },
})
