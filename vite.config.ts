import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 3000,
    assetsDir: 'static',
    // Allègement : bibliothèques dans des fichiers séparés (téléchargés en
    // parallèle et gardés en cache d'une version du jeu à l'autre)
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\/]three[\/]/ },
            { name: 'r3f', test: /node_modules[\/](@react-three|three-stdlib|troika|camera-controls|maath|meshline|zustand)/ },
            { name: 'physique', test: /node_modules[\/]@dimforge/ },
            { name: 'react', test: /node_modules[\/](react|react-dom|scheduler)[\/]/ },
          ],
        },
      },
    },
  },
})
