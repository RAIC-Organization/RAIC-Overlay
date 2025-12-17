/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  // Disable trailing slash to match Vite's behavior
  trailingSlash: false,
};

export default nextConfig;
