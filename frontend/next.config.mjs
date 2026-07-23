import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'http://localhost:5001/auth/:path*',
      },
      {
        source: '/admin/api/:path*',
        destination: 'http://localhost:5001/admin/api/:path*',
      },
      // Logo fallback
      {
        source: '/assets/logo_horizontal.png',
        destination: '/dbfdc78a-4740-4637-96a6-bdd001e44a75.png',
      },
      // PNG images
      {
        source: '/dbfdc78a-4740-4637-96a6-bdd001e44a75',
        destination: '/dbfdc78a-4740-4637-96a6-bdd001e44a75.png',
      },
      {
        source: '/e997821b-faa9-4a79-85a8-6eb4928f9ef0',
        destination: '/e997821b-faa9-4a79-85a8-6eb4928f9ef0.png',
      },
      {
        source: '/0a69af53-6815-4d09-898c-ee12b9b10d71',
        destination: '/0a69af53-6815-4d09-898c-ee12b9b10d71.png',
      },
      {
        source: '/20ad908d-4854-41c4-9251-365e0cf2f557',
        destination: '/20ad908d-4854-41c4-9251-365e0cf2f557.png',
      },
      // UUID fonts (woff2) fallback
      {
        source: '/:uuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})',
        destination: '/:uuid.woff2',
      },
    ];
  },
};

export default nextConfig;
