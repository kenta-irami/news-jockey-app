import AuthButton from "./AuthButton";

export default function Header() {
  return (
    <header className="w-full p-4 bg-white shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <a
          href="/"
          className="text-2xl font-bold text-gray-800 hover:text-gray-600"
        >
          News Jockey
        </a>
        <AuthButton />
      </div>
    </header>
  );
}
