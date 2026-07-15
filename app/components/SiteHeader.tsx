"use client";

import Link from "next/link";
import { useState } from "react";

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f7f6f2]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="Retour à l'accueil MaZone">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-950 text-white shadow-lg shadow-black/15 transition group-hover:-rotate-3 group-hover:scale-105">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" fill="#fb923c" stroke="none" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="block text-xl font-black tracking-[-0.04em] text-zinc-950">
              Ma<span className="text-orange-500">Zone</span>
            </span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Sortir autrement
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-black/5 bg-white/80 p-1 shadow-sm sm:flex" aria-label="Navigation principale">
          <Link href="/#events" className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-950 hover:text-white">
            Explorer
          </Link>
          <Link href="/#map-section" className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-950 hover:text-white">
            Carte
          </Link>
          <Link href="/#favorites" className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-950 hover:text-white">
            Favoris
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((value) => !value)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          className="grid h-11 w-11 cursor-pointer place-items-center rounded-2xl border border-black/5 bg-white text-zinc-950 shadow-sm transition hover:bg-orange-50 sm:hidden"
        >
          <span className="relative block h-4 w-5" aria-hidden="true">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition duration-200 ${
                isMenuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition duration-200 ${
                isMenuOpen ? "scale-x-0 opacity-0" : ""
              }`}
            />
            <span
              className={`absolute bottom-0 left-0 h-0.5 w-5 rounded-full bg-current transition duration-200 ${
                isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      <nav
        id="mobile-navigation"
        aria-label="Navigation mobile"
        aria-hidden={!isMenuOpen}
        className={`overflow-hidden border-t border-black/5 bg-[#f7f6f2] transition-all duration-300 sm:hidden ${
          isMenuOpen ? "max-h-80 opacity-100" : "pointer-events-none max-h-0 border-transparent opacity-0"
        }`}
      >
        <div className="mx-auto grid max-w-7xl gap-2 px-5 py-4">
          {[
            { href: "/#events", label: "Explorer", description: "Voir tous les événements" },
            { href: "/#map-section", label: "Carte", description: "Explorer les lieux autour de vous" },
            { href: "/#favorites", label: "Favoris", description: "Retrouver vos coups de cœur" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={isMenuOpen ? 0 : -1}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5 transition hover:bg-orange-50"
            >
              <span>
                <span className="block text-sm font-black text-zinc-950">{item.label}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{item.description}</span>
              </span>
              <span className="text-orange-500" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
