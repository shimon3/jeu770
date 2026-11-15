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
            // Effets d'image : hors du lot principal, chargés seulement si la qualité les active
            { name: 'effets', test: /node_modules[\/](postprocessing|n8ao|@react-three[\/]postprocessing)[\/]/, priority: 10 },
            { name: 'three', test: /node_modules[\/]three[\/]/, priority: 30 },
            { name: 'r3f', test: /node_modules[\/](@react-three[\/](?!postprocessing)|three-stdlib|troika|camera-controls|maath|meshline|zustand)/, priority: 25 },
            { name: 'physique', test: /node_modules[\/]@dimforge/ },
            { name: 'react', test: /node_modules[\/](react|react-dom|scheduler)[\/]/, priority: 30 },
          ],
        },
      },
    },
  },
})
