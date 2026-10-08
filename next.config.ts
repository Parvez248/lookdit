import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Case-study images live in a public Vercel Blob store. Only that host is
    // optimised; any other remote src is refused by the image optimiser.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/projects/**" }],
  },
  experimental: {
    serverActions: {
      // Image uploads go through a Server Action: 4 MB file + multipart overhead,
      // under Vercel's 4.5 MB request cap. See MEDIA_UPLOAD_MAX_BYTES.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
