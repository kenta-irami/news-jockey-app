import { GoogleGenerativeAI } from "@google/generative-ai";
import * as deepl from "deepl-node";
import Parser from "rss-parser";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { MongoClient, ObjectId } from "mongodb"; // ObjectId をインポート
import fs from "fs/promises";
import path from "path";

// --- 初期設定 ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
const translator = new deepl.Translator(process.env.DEEPL_API_KEY);
const ttsClient = new TextToSpeechClient();
const mongoClient = new MongoClient(process.env.MONGODB_URI);

const PROMPT_FOR_SUMMARY = `Analyse the content of the following news article link and provide a concise summary in English, consisting of three bullet points. Use "*" for each bullet point. Do not include any introductory or concluding remarks. Output only the summary. News Article Link:`;
const OUTPUT_DIR = path.join(process.cwd(), "public", "audio");

// --- メインの処理関数 ---
// userId を引数として受け取るように変更
export async function processNews(userId) {
  if (!userId) {
    throw new Error("User ID is required to process news.");
  }

  let db;
  try {
    await mongoClient.connect();
    db = mongoClient.db("news-jockey-db");
    const usersCollection = db.collection("users");
    const articlesCollection = db.collection("articles");

    // 1. ユーザーのRSSフィード設定を取得
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user || !user.rssFeeds || user.rssFeeds.length === 0) {
      return {
        success: false,
        message:
          "RSSフィードが設定されていません。設定ページから追加してください。",
      };
    }

    // とりあえず最初のRSSフィードを使う（今後は複数対応も可能）
    const RSS_FEED_URL = user.rssFeeds[0].url;
    console.log(
      `📰 ユーザー[${userId}]のRSSフィード[${RSS_FEED_URL}]から記事を取得します...`
    );

    // 2. RSSから記事取得
    const parser = new Parser();
    const feed = await parser.parseURL(RSS_FEED_URL);
    if (!feed.items.length) {
      return { success: false, message: "新しい記事が見つかりませんでした。" };
    }
    const latestArticle = feed.items[0];
    console.log(`📄 取得した記事タイトル: ${latestArticle.title}`);

    // 3. 重複チェック
    const existingArticle = await articlesCollection.findOne({
      url: latestArticle.link,
      ownerId: new ObjectId(userId),
    });
    if (existingArticle) {
      return {
        success: true,
        message: "この記事はすでに処理済みです。",
        article: existingArticle,
      };
    }

    // ... (AI処理部分はこれまでと同じ) ...
    console.log("🤖 Geminiで要約中...");
    const summaryResult = await model.generateContent(
      PROMPT_FOR_SUMMARY + latestArticle.link
    );
    const summaryText = (await summaryResult.response).text();

    console.log("🌐 DeepLで翻訳中...");
    const translatedResult = await translator.translateText(
      summaryText,
      "en",
      "ja"
    );
    const translatedText = translatedResult.text;

    console.log("🔊 音声ファイルを作成中...");
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const ttsRequest = {
      input: { text: translatedText },
      voice: { languageCode: "ja-JP", ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "MP3" },
    };
    const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);
    const audioFileName = `${Date.now()}.mp3`;
    await fs.writeFile(
      path.join(OUTPUT_DIR, audioFileName),
      ttsResponse.audioContent,
      "binary"
    );
    console.log(`✅ 音声ファイルを保存しました: /audio/${audioFileName}`);

    // 4. DBに保存（誰の記事かを記録）
    console.log("💾 データベースに結果を保存中...");
    const articleDocument = {
      title: latestArticle.title,
      url: latestArticle.link,
      summary: summaryText,
      translation: translatedText,
      audioFileName: audioFileName,
      audioUrl: `/audio/${audioFileName}`,
      processedAt: new Date(),
      ownerId: new ObjectId(userId), // ★★★ 誰の記事かを記録
    };
    await articlesCollection.insertOne(articleDocument);

    return {
      success: true,
      message: "全ての処理が正常に完了しました！",
      article: articleDocument,
    };
  } catch (error) {
    console.error("エラーが発生しました:", error);
    return {
      success: false,
      message: "サーバーでエラーが発生しました。",
      error: error.message,
    };
  } finally {
    if (db) {
      await mongoClient.close();
      console.log("🔌 データベース接続を閉じました。");
    }
  }
}
