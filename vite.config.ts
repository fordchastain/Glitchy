import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset paths so the build works under a GitHub Pages project
  // subpath (https://<user>.github.io/Glitchy/) without hardcoding the repo name.
  base: './',
  plugins: [react()],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.node']
  }
})
