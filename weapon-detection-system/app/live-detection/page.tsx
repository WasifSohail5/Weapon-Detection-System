import { Navbar } from "@/components/navbar"
import { LiveDetection } from "@/components/live-detection"

export default function LiveDetectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <LiveDetection />
      </main>
    </div>
  )
}
