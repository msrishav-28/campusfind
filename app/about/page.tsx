import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3.5 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400">Help & Guidelines</p>
            <h1 className="text-base font-semibold text-zinc-100">About CampusFind</h1>
          </div>
          <Link
            href="/kengeri"
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-zinc-800"
          >
            ← Campus Map
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-xl px-4 py-6 space-y-6 pb-20">
        {/* Core Mission */}
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <h2 className="text-lg font-bold text-emerald-300">Fast, Map-First Lost & Found</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
            CampusFind replaces noisy, scattered WhatsApp messages with a shared spatial memory for CHRIST (Deemed to be University), Bangalore Kengeri. Snap a photo, speak a sentence, and drop a pin in under 20 seconds.
          </p>
        </div>

        {/* How It Works */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">How It Works</h3>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  1
                </span>
                <h4 className="text-sm font-semibold text-zinc-100">Found something? Pin it in 20s</h4>
              </div>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                Take a quick photo, tap the microphone to describe it, and your phone&apos;s GPS automatically snaps to the nearest campus spot (like Block IV Cafeteria or the Campus Library). No account required to post.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  2
                </span>
                <h4 className="text-sm font-semibold text-zinc-100">Lost something? Search or check matches</h4>
              </div>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                Filter by &ldquo;Lost&rdquo; or &ldquo;Near me&rdquo; to see recent reports in the area. When a matching item exists, the system suggests the top 3 candidate pins based on proximity, tags, and time.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  3
                </span>
                <h4 className="text-sm font-semibold text-zinc-100">Prove ownership with private detail</h4>
              </div>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                To claim an item, you provide a private identifying feature (like a keychain, sticker, or lock screen wallpaper). This detail is hashed and never published on the map.
              </p>
            </div>
          </div>
        </div>

        {/* Safety & Trust Rules */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Safety & Trust Policy</h3>

          <ul className="space-y-2.5 text-xs text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>
                <strong>Meet in public places:</strong> Always arrange handovers at open campus spots such as Block IV cafeteria, Block I lobby, or the main entrance gate.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">⚠️</span>
              <span>
                <strong>Student ID Cards:</strong> Never post readable register numbers or ID card faces. Always cover student numbers before uploading.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">🏢</span>
              <span>
                <strong>14-Day Expiry Rule:</strong> Items that remain unclaimed after 14 days leave the public map and are handed over to the Block I security desk.
              </span>
            </li>
          </ul>
        </div>

        {/* Security Desk Info */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">Campus Staff & Security Desk</span>
            <Link href="/kengeri/desk" className="text-emerald-400 hover:underline">
              Desk Portal →
            </Link>
          </div>
          <p>
            Block I Security maintains the physical holding area for uncollected campus property. Authorized staff can log in using the desk PIN.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-zinc-800/80 pt-4 text-center text-[11px] text-zinc-400 space-y-1">
          <p>CampusFind is an independent, student-run campus utility for CHRIST Kengeri.</p>
          <p>Pins do not constitute an official university police report or institutional guarantee.</p>
        </div>
      </section>
    </main>
  );
}
