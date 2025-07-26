import NewsProcessor from "./NewsProcessor"; // 作成したコンポーネントをインポート

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-24 bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">
          News Jockey
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Your AI-powered news briefing assistant.
        </p>
      </div>

      {/* ここにコンポーネントを配置 */}
      <NewsProcessor />
    </main>
  );
}
