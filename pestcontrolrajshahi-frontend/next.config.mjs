/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  turbopack: {
    // Allows Turbopack to securely access hoisted packages 3 levels up
    root: path.resolve(__dirname, '../../../'),
  },
};

export default nextConfig;