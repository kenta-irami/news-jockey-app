import { NextResponse } from "next/server";
import { processNews } from "@/lib/newsProcessor"; // @ は src ディレクトリを指すエイリアス

export async function GET() {
  console.log("API /api/process-news が呼び出されました。");

  // サーバーサイドでニュース処理を実行
  const result = await processNews();

  // 処理結果をJSON形式でクライアントに返す
  if (result.success) {
    return NextResponse.json(result);
  } else {
    // エラーが発生した場合は、500エラーを返す
    return NextResponse.json(result, { status: 500 });
  }
}
