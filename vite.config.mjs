import { defineConfig } from 'vite';

export default defineConfig({
    base: '/colourmix-sim/',
    server: {
        watch: {
            usePolling: true,
            interval: 1000,
        },
    },
});
