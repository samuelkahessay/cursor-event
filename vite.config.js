import { defineConfig } from 'vite';
import claudeProxy from './vite-plugin-claude-proxy.js';

export default defineConfig({
  plugins: [claudeProxy()],
});
