/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The frontend talks to the backend via NEXT_PUBLIC_API_URL.
  // We don't proxy from Next on purpose — keeping origins separate makes the multi-cloud
  // deploy simpler (each gets its own URL / domain).
};

module.exports = nextConfig;
