import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // 设置基础路径
  build: {
    outDir: 'dist', // 指定输出目录
    sourcemap: true, // 生成 sourcemap
    minify: 'terser', // 使用 terser 进行代码压缩
  },
  server: {
    host: true, // 允许外部访问
    port: 5173, // 指定端口
  }
}) 