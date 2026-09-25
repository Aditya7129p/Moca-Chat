import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MocaChat</h1>
        <p className="text-gray-500 mb-8">
          AI-powered customer service agents for your business.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center h-9 px-5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-9 px-5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
