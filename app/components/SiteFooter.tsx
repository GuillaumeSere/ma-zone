export default function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-linear-to-r from-rose-500 via-orange-500 to-amber-400 text-white">
      <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs font-semibold">
        © {new Date().getFullYear()} Ma<span className="text-black">Zone</span> Tous droits réservés.
      </div>
    </footer>
  );
}
