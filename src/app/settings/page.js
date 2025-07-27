"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [feeds, setFeeds] = useState([]);
  const [rssUrl, setRssUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 登録済みフィードを取得する関数
  const fetchFeeds = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to fetch feeds.");
      const data = await response.json();
      setFeeds(data);
    } catch (err) {
      setError(err.message);
    }
  }, [status]);

  // ページ読み込み時にフィードを取得
  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  // 認証状態のチェック
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // 新規追加の処理
  const handleAdd = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rssUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong");

      setRssUrl("");
      fetchFeeds(); // 一覧を再読み込み
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 削除の処理
  const handleDelete = async (feedId) => {
    if (!confirm("本当にこのフィードを削除しますか？")) return;

    try {
      const response = await fetch("/api/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong");

      fetchFeeds(); // 一覧を再読み込み
    } catch (err) {
      setError(err.message);
    }
  };

  if (status === "loading" || !session) {
    return <div className="text-center p-12">Loading...</div>;
  }

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">設定</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">RSSフィードの管理</h2>

        <form onSubmit={handleAdd} className="mb-8">
          <label
            htmlFor="rssUrl"
            className="block text-gray-700 font-semibold mb-2"
          >
            新しいRSSフィードのURLを追加
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              id="rssUrl"
              value={rssUrl}
              onChange={(e) => setRssUrl(e.target.value)}
              className="flex-grow p-2 border border-gray-300 rounded-lg"
              placeholder="https://example.com/feed.xml"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "..." : "追加"}
            </button>
          </div>
        </form>

        {error && <p className="mb-4 text-red-600">エラー: {error}</p>}

        <div>
          <h3 className="text-xl font-semibold">登録済みフィード</h3>
          <ul className="mt-4 space-y-2">
            {feeds.length > 0 ? (
              feeds.map((feed) => (
                <li
                  key={feed._id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-800 break-all">{feed.url}</span>
                  <button
                    onClick={() => handleDelete(feed._id)}
                    className="px-3 py-1 text-sm font-semibold text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                  >
                    削除
                  </button>
                </li>
              ))
            ) : (
              <p className="text-gray-500">登録済みのフィードはありません。</p>
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}
