"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <a
          href="/settings"
          className="font-semibold text-gray-600 hover:text-blue-600"
        >
          設定
        </a>

        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || "User avatar"}
            width={40}
            height={40}
            className="rounded-full"
          />
        )}
        <button
          onClick={() => signOut()}
          className="px-4 py-2 font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
        >
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("line")}
      className="px-4 py-2 font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 flex items-center gap-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12.18,9.66c-1,0-1.78.2-2.42.58a3,3,0,0,0-1.63,2.78c0,1.45.78,2.7,2.13,3.35,1.13.55,2.53.55,3.48,0,1.2-.55,1.93-1.7,1.93-3.13,0-1.1-.5-2-1.28-2.6A3.33,3.33,0,0,0,12.18,9.66Zm-2.73,3.2c0-.5.28-.9.78-1.15s1.2-.25,1.75-.25,1.25,0,1.75.25.78.65.78,1.15c0,.5-.28.9-.78,1.15s-1.2.25-1.75.25-.05,0-.1,0C10.23,14,9.45,13.25,9.45,12.86Zm8.7-6.28a9.43,9.43,0,0,0-11,0A10,10,0,0,0,2.15,14.73a8.13,8.13,0,0,0,3.35,3.7,11.3,11.3,0,0,0,6.55,1.53h.1a8.3,8.3,0,0,0,6.8-4.63,9.43,9.43,0,0,0,0-11Zm-1,10.28a7.3,7.3,0,0,1-5.7,3.93,10.3,10.3,0,0,1-6-1.38,7.13,7.13,0,0,1-3-3.25,9,9,0,0,1,0-9.45,8.43,8.43,0,0,1,9.9,0,8,8,0,0,1,3.75,6.2A8.43,8.43,0,0,1,17.42,16.86Z" />
      </svg>
      LINEでログイン
    </button>
  );
}
