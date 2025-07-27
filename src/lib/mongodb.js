// src/lib/mongodb.js
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // 開発環境では、ホットリロードで新しい接続が作られすぎないようにグローバル変数を使う
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // 本番環境では、都度接続を作成
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
