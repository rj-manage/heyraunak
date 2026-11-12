import type { Metadata } from "next";
import "@/styles/app.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.heyraunak.site"),
  title: "RJ Studio",
  description:
    "RJ Studio - design & development studio and services marketplace for web, software and digital marketing.",
  icons: { icon: "/assets/RJ_Logo.png", apple: "/assets/RJ_Logo.png" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* the same stylesheets the public site uses - shared design system */}
        <link rel="stylesheet" href="/css/fonts.css" />
        <link rel="stylesheet" href="/css/site.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
