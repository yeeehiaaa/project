import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  // Autorise le test depuis un téléphone sur le même Wi-Fi (adresse LAN).
  // Si ton IP locale change, remplace-la par la nouvelle (voir le terminal : Network: http://...).
  allowedDevOrigins: ["192.168.100.10"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
