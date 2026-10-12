import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlexDesk Admin",
  description: "FlexDesk administration dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
