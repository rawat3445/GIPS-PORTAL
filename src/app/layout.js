import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "GIPS",
  description: "GIPS Portal",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
