// src/app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import LineProvider from "next-auth/providers/line";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb"; // 先ほど作成したDB接続ファイルをインポート

export const authOptions = {
  // 1. 認証プロバイダーの設定
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID,
      clientSecret: process.env.LINE_CLIENT_SECRET,
    }),
    // 他のプロバイダー（Googleなど）もここに追加できる
  ],

  // 2. データベースアダプターの設定
  adapter: MongoDBAdapter(clientPromise),

  // 3. セッション管理方法の指定
  session: {
    strategy: "jwt", // JWTを使うと、セッション管理が高速になる
  },

  // 4. コールバックの設定（オプションだが重要）
  callbacks: {
    // セッションにユーザーIDなどの情報を追加する
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
    // JWTにユーザー情報をエンコードする
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
  },

  // 5. ログイン/ログアウトページの指定（オプション）
  // pages: {
  //   signIn: '/auth/signin',
  // },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
