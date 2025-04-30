import { CircleTimer } from "@/components/circle-timer"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">円グラフタイマー</h1>
          <p className="mt-2 text-gray-600">時間の経過を視覚的に確認できるタイマーです</p>
        </div>
        <CircleTimer />
      </div>
    </main>
  )
}
