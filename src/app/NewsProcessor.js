"use client"; // このファイルがクライアントコンポーネントであることを示す

import { useState } from "react";

export default function NewsProcessor() {
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleProcessNews = async () => {
    setIsLoading(true);
    setError(null);
    setArticle(null);

    try {
      const response = await fetch("/api/process-news");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "エラーが発生しました。");
      }

      setArticle(data.article);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mt-12">
      <button
        onClick={handleProcessNews}
        disabled={isLoading}
        className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-200"
      >
        {isLoading ? "処理中..." : "最新ニュースを取得＆要約"}
      </button>

      {error && (
        <div className="mt-6 p-4 text-red-700 bg-red-100 border border-red-400 rounded-lg">
          <strong>エラー:</strong> {error}
        </div>
      )}

      {article && (
        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg transition-all duration-300">
          <h2 className="text-2xl font-bold text-gray-800">{article.title}</h2>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700">
              要約 (日本語)
            </h3>
            <p className="mt-2 text-gray-600 whitespace-pre-line">
              {article.translation}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700">音声で聴く</h3>
            <audio controls src={article.audioUrl} className="w-full mt-2">
              お使いのブラウザは音声再生に対応していません。
            </audio>
          </div>

          <div className="mt-6 pt-4 border-t">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              原文を読む →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
