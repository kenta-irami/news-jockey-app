// src/app/api/process-news/route.js

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

// ★★★ ここから、newsProcessor.jsの中身を統合 ★★★
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as deepl from "deepl-node";
import Parser from "rss-parser";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { MongoClient, ObjectId } from "mongodb";
import fs from "fs/promises";
import path from "path";

const PROMPT_FOR_SUMMARY = `Analyse the content of the following news article link and provide a concise summary in English, consisting of three bullet points. Use "*" for each bullet point. Do not include any introductory or concluding remarks. Output only the summary. News Article Link:`;
const OUTPUT_DIR = path.join(process.cwd(), "public", "audio");
// ★★★ ここまで ★★★

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { success: false, message: "ログインしてください。" },
      { status: 401 }
    );
  }
  const userId = session.user.id;
  console.log(
    `API /api/process-news がユーザー[${userId}]によって呼び出されました。`
  );

  // ★★★ ここから、processNews関数のロジックを直接展開 ★★★
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
  const translator = new deepl.Translator(process.env.DEEPL_API_KEY);
  const mongoClient = new MongoClient(process.env.MONGODB_URI);

  const gcpCredentialsBase64 = process.env.GCP_CREDENTIALS_BASE64;
  if (!gcpCredentialsBase64) {
    return NextResponse.json(
      { success: false, message: "サーバー設定エラー (GCP Creds)" },
      { status: 500 }
    );
  }
  const credentialsJson = Buffer.from(gcpCredentialsBase64, "base64").toString(
    "utf-8"
  );
  const credentials = JSON.parse(credentialsJson);
  const ttsClient = new TextToSpeechClient({ credentials });

  let db;
  try {
    await mongoClient.connect();
    db = mongoClient.db("news-jockey-db");
    const usersCollection = db.collection("users");
    const articlesCollection = db.collection("articles");

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user || !user.rssFeeds || user.rssFeeds.length === 0) {
      return NextResponse.json({
        success: false,
        message: "RSSフィードが設定されていません。",
      });
    }

    const RSS_FEED_URL = user.rssFeeds[0].url;

    const parser = new Parser();
    const feed = await parser.parseURL(RSS_FEED_URL);
    if (!feed.items.length) {
      return NextResponse.json({
        success: false,
        message: "新しい記事が見つかりませんでした。",
      });
    }
    const latestArticle = feed.items[0];

    const existingArticle = await articlesCollection.findOne({
      url: latestArticle.link,
      ownerId: new ObjectId(userId),
    });
    if (existingArticle) {
      return NextResponse.json({
        success: true,
        message: "この記事はすでに処理済みです。",
        article: existingArticle,
      });
    }

    const summaryResult = await model.generateContent(
      PROMPT_FOR_SUMMARY + latestArticle.link
    );
    const summaryText = (await summaryResult.response).text();

    const translatedResult = await translator.translateText(
      summaryText,
      "en",
      "ja"
    );
    const translatedText = translatedResult.text;

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

    const articleDocument = {
      title: latestArticle.title,
      url: latestArticle.link,
      summary: summaryText,
      translation: translatedText,
      audioFileName: audioFileName,
      audioUrl: `/audio/${audioFileName}`,
      processedAt: new Date(),
      ownerId: new ObjectId(userId),
    };
    await articlesCollection.insertOne(articleDocument);

    return NextResponse.json({
      success: true,
      message: "全ての処理が正常に完了しました！",
      article: articleDocument,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: "サーバーで予期せぬエラーが発生しました。" },
      { status: 500 }
    );
  } finally {
    if (db) {
      await mongoClient.close();
    }
  }
  // ★★★ ここまで ★★★
}
