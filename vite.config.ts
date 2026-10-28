import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // antd 单包压缩后约 930 KB，拆出来后可长期缓存，属于预期体积
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 把体积大且更新频率低的依赖拆成独立 chunk，页面代码改动时不必重新下载
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          if (
            /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(
              id,
            )
          ) {
            return "vendor-react"
          }
          if (
            /node_modules\/(d3|d3-cloud|react-d3-cloud|@types\/d3-cloud)\//.test(
              id,
            )
          ) {
            return "vendor-d3"
          }
          if (
            id.includes("node_modules/antd") ||
            id.includes("node_modules/@ant-design") ||
            id.includes("node_modules/rc-")
          ) {
            return "vendor-antd"
          }
          return "vendor"
        },
      },
    },
  },
})
