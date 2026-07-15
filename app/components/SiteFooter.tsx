export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-black/5 bg-zinc-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-center sm:flex-row sm:text-left">
        <div>
          <p className="text-lg font-black tracking-tight">Ma<span className="text-orange-400">Zone</span></p>
          <p className="mt-1 text-xs text-zinc-400">Les bonnes sorties, au bon endroit.</p>
        </div>
        <p className="text-xs font-medium text-zinc-500">
          © {new Date().getFullYear()} MaZone · Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
