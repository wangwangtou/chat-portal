import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

function resolve_path(dir) {
  return path.join(__dirname, "./", dir);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    //别名，代码引入时方便引入
    alias: [
      { find: /^@beagle\/chat-components/, replacement: resolve_path("../src") },
      { find: /^~/, replacement: "" },
    ]
  },
})
