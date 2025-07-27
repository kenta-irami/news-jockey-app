import NewsProcessor from "./NewsProcessor";
// import AuthButton from "./AuthButton"; // ← もう不要なので削除

export default function Home() {
  return (
    // <></> や <header> を削除
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 bg-gray-50">
      <div className="text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-800 mt-12">
          AI News Briefing
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Your personal news assistant.
        </p>
      </div>

      <NewsProcessor />
    </main>
  );
}
