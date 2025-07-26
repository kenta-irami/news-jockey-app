import { GoogleGenerativeAI } from "@google/generative-ai";
import * as deepl from "deepl-node";
import Parser from "rss-parser";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { MongoClient } from "mongodb";
import fs from "fs/promises"; // fs/promises を使うと util.promisify が不要
import path from "path";

// --- 初期設定 ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
const translator = new deepl.Translator(process.env.DEEPL_API_KEY);
const ttsClient = new TextToSpeechClient();
const mongoClient = new MongoClient(process.env.MONGODB_URI);

const PROMPT_FOR_SUMMARY = `Analyse the content of the following news article link and provide a concise summary in English, consisting of three bullet points. Use "*" for each bullet point. Do not include any introductory or concluding remarks. Output only the summary. News Article Link:`;
const RSS_FEED_URL =
  "https://news.google.com/rss/search?q=technology&hl=en-US&gl=US&ceid=US:en";

// Next.jsでは public フォルダに音声ファイルを保存するのが一般的
const OUTPUT_DIR = path.join(process.cwd(), "public", "audio");

// --- メインの処理関数 ---
export async function processNews() {
  let db;
  try {
    // 0. 出力ディレクトリの存在確認・作成
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // 1. RSSから記事取得
    console.log("📰 ニュース記事の取得を開始...");
    const parser = new Parser();
    const feed = await parser.parseURL(RSS_FEED_URL);
    if (!feed.items.length) {
      return { success: false, message: "新しい記事が見つかりませんでした。" };
    }
    const latestArticle = feed.items[0];
    console.log(`📄 取得した記事タイトル: ${latestArticle.title}`);

    // 2. DB接続と重複チェック
    await mongoClient.connect();
    db = mongoClient.db("news-jockey-db");
    const articlesCollection = db.collection("articles");
    const existingArticle = await articlesCollection.findOne({
      url: latestArticle.link,
    });
    if (existingArticle) {
      console.log("🟡 この記事はすでに処理済みです。");
      return {
        success: true,
        message: "この記事はすでに処理済みです。",
        article: existingArticle,
      };
    }

    // 3. 各API処理
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

    // 4. DBに保存
    console.log("💾 データベースに結果を保存中...");
    const articleDocument = {
      title: latestArticle.title,
      url: latestArticle.link,
      summary: summaryText,
      translation: translatedText,
      audioFileName: audioFileName,
      audioUrl: `/audio/${audioFileName}`, // ブラウザからアクセスするためのパス
      processedAt: new Date(),
    };
    await articlesCollection.insertOne(articleDocument);
    console.log("✅ データベースへの保存完了");

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
