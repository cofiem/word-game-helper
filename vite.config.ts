import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    root: resolve(__dirname, 'src'),
    publicDir: resolve(__dirname, 'public'),
    base: '/word-game-helper/',
    resolve: {
        alias: {
            '~bootstrap': resolve(__dirname, 'node_modules/bootstrap'),
        }
    },
    build: {
        outDir: '../docs',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src', 'index.html'),
                wordle: resolve(__dirname, 'src', 'wordle', 'index.html'),
                foximax: resolve(__dirname, 'src', 'foximax', 'index.html'),
            },
        },
    },
});
