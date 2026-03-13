import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dračí Hlídka – RPG Narrator Engine",
  description: "Správa kampaní, postáv a sessionů pre Dračí Hlídku",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
