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
  // trailing-slash redirect so the rewrites below can serve both shapes.
  skipTrailingSlashRedirect: true,
  // The old "Works" section is now "Products". Keep every legacy /works URL
  // working with a permanent redirect so bookmarks and search results survive.
  async headers() {
    return [
      {
        // The scroll-scrubbed walk ships ~192 content-stable frame images.
        // Cache them hard so a return visit never revalidates them one by one.
        source: "/portfolio/RJ_Walk_Final/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, immutable" }
        ]
      }
    ];
  },
  async redirects() {
    return [
      { source: "/works", destination: "/products/", permanent: true },
      { source: "/works/", destination: "/products/", permanent: true },
      { source: "/works/index.html", destination: "/products/", permanent: true }
    ];
  },
  async rewrites() {
    const legacyDirs = [
      "services",
      "services/website-development",
      "services/software-app-development",
      "services/digital-marketing",
      "services/social-media-marketing",
      "services/student-projects",
      "products",
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
