/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.60.198.38', 'localhost:3000'],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;