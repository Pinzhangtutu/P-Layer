import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Python 后端保留"分析重活"：R 脚本执行、Ollama 推理、Zotero 同步、RAG 检索
const PYTHON_API = process.env.PLAYER_PY_API || 'http://127.0.0.1:8766'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // 分析类 API 继续走 Python
      '/api/r': { target: PYTHON_API, changeOrigin: true },
      '/api/assistant': { target: PYTHON_API, changeOrigin: true },
      '/api/health': { target: PYTHON_API, changeOrigin: true },
      '/api/ollama': { target: PYTHON_API, changeOrigin: true },
      '/api/zotero': { target: PYTHON_API, changeOrigin: true },
      '/api/rag': { target: PYTHON_API, changeOrigin: true },
      '/api/ocr': { target: PYTHON_API, changeOrigin: true },
      '/api/services': { target: PYTHON_API, changeOrigin: true },
      '/plots': { target: PYTHON_API, changeOrigin: true },
      // 其余 /api/* 将来由 Node/Express 5 主 API 接管（第二步）
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
