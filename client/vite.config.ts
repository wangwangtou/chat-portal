import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'

function resolve_path(dir) {
  return path.join(__dirname, "./", dir);
}
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    //别名，代码引入时方便引入
    alias: [
      { find: /^@\//, replacement: resolve_path("./src/") },
    ],
  },
})
