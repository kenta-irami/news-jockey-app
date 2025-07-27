import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

async function getDb() {
  const client = await new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  return client.db("news-jockey-db");
}

// GETリクエスト：登録済みのRSSフィード一覧を取得する
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({
      _id: new ObjectId(session.user.id),
    });

    // rssFeedsが存在しない場合は空の配列を返す
    return NextResponse.json(user?.rssFeeds || []);
  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POSTリクエスト：新しいRSSフィードを追加する（以前のコードを少し修正）
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rssUrl } = await request.json();
    if (!rssUrl) {
      return NextResponse.json(
        { error: "RSS URL is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection("users");

    // ★★★ 削除機能のために、各フィードにユニークなIDを付与 ★★★
    const newFeed = {
      _id: new ObjectId(), // ← これを追加
      url: rssUrl,
      addedAt: new Date(),
    };

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $push: { rssFeeds: newFeed } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to add RSS feed" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, newFeed });
  } catch (error) {
    console.error("API POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETEリクエスト：指定されたRSSフィードを削除する
export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { feedId } = await request.json();
    if (!feedId) {
      return NextResponse.json(
        { error: "Feed ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection("users");

    // $pull演算子で、配列から指定したIDの要素を削除する
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $pull: { rssFeeds: { _id: new ObjectId(feedId) } } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Feed not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "RSS feed deleted successfully!",
    });
  } catch (error) {
    console.error("API DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
