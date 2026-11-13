// RJ Studio - Next.js configuration.
//
// The original static site now lives in /public and is served byte-identical.
// The rewrites below exist only because Next.js does not resolve a directory
// URL ("/services/") to "/services/index.html" from /public the way the old
// static host did. Item pages that already end in ".html" need no rewrite.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The public site's canonical URLs end in "/" (see sitemap.xml) and the live
  // static host served both "/services" and "/services/". Disable Next's
  // trailing-slash redirect so the rewrites below can serve both shapes - and
  // so API paths such as /api/enquiry are never redirected.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const legacyDirs = [
      "services",
      "works",
      "portfolio",
      "gallery",
      "facesgallery",
      "appfacesgallery",
      "formsgallery",
      "mousemotionsgallery",
      "contact"
    ];

    const beforeFiles = [{ source: "/", destination: "/index.html" }];
    for (const dir of legacyDirs) {
      beforeFiles.push({ source: `/${dir}`, destination: `/${dir}/index.html` });
      beforeFiles.push({ source: `/${dir}/`, destination: `/${dir}/index.html` });
    }

    return { beforeFiles, afterFiles: [], fallback: [] };
  }
};

export default nextConfig;
