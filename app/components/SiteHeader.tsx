import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-linear-to-r from-rose-500 via-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-3xl bg-black/85 ring-1 ring-white/30 backdrop-blur" />
          <div className="leading-tight">
            <Link href="/" className="block">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Ma<span className="text-gray-900">Zone</span>
              </h1>
              <p className="text-xs text-white/80">Evenements pres de vous</p>
            </Link>
          </div>
        </div>

        <span className="hidden sm:inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30">
          Decouverte locale
        </span>
      </div>
    </header>
  );
}
