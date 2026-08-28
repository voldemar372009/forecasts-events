/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        // Старые адреса категорий /ru/category/POLITICS → /ru/POLITICS
        source: "/:locale/category/:category",
        destination: "/:locale/:category",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
