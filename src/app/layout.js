import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "./SessionProvider";
import Header from "./Header"; // ← 新しく作ったHeaderをインポート

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "News Jockey",
  description: "Your AI-powered news briefing assistant.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <SessionProvider>
          {/* ここにHeaderを配置 */}
          <Header />
          {/* {children} が各ページの中身に置き換わる */}
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
