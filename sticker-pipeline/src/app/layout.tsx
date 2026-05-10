import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sticker Pipeline",
  description: "Idea → prompt → image → monochrome → SVG",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
