import AuthButton from "./AuthButton";
import Link from "next/link"; // ← Linkコンポーネントをインポート

export default function Header({ session }) {
  return (
    <header className="w-full p-4 bg-white shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* aタグをLinkコンポーネントに置き換える */}
        <Link
          href="/"
          className="text-2xl font-bold text-gray-800 hover:text-gray-600"
        >
          News Jockey
        </Link>
        <AuthButton session={session} />
      </div>
    </header>
  );
}
