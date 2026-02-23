import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Interface — Presence OS",
  description: "Operator dashboard for content review and task management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
