/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.spoonacular.com' },
      { protocol: 'https', hostname: 'spoonacular.com' },
      { protocol: 'https', hostname: 'www.themealdb.com' },
      { protocol: 'https', hostname: 'www.edamam.com' },
      { protocol: 'https', hostname: 'edamam-product-images.s3.amazonaws.com' }
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(process.cwd(), 'src'),
    };
    return config;
  },
}

module.exports = nextConfig 