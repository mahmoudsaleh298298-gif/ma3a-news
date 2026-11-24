/** @type {import('next').NextConfig} */
export default {
  experimental: { serverComponentsExternalPackages: ['pg'] },
  images: {
    // الصور تُخدم من Cloudinary مباشرة (محسّنة وبصيغة حديثة) عبر lib/imageLoader.js
    loader: 'custom',
    loaderFile: './lib/imageLoader.js',
    deviceSizes: [640, 828, 1200, 1600],
    imageSizes: [96, 160, 256, 384],
  },
};
