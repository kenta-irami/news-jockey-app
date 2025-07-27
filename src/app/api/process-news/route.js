import { NextResponse } from "next/server";
import { processNews } from "@/lib/newsProcessor";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  // セッションからユーザー情報を取得
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { success: false, message: "ログインしてください。" },
      { status: 401 }
    );
  }

  console.log(
    `API /api/process-news がユーザー[${session.user.id}]によって呼び出されました。`
  );

  // ユーザーIDを渡してニュース処理を実行
  const result = await processNews(session.user.id);

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 500 });
  }
}
