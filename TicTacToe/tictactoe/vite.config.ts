import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // shared/ sits above this app, so a bare "react" import inside it would
    // resolve from shared/ upward and never find this app's copy. Dedupe
    // resolves both from the app root, which also guarantees one React in the
    // bundle - two would break hooks at runtime.
    dedupe: ['react', 'react-dom'],
  },
})
