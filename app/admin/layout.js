import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/draws", label: "Draws" },
  { href: "/admin/charities", label: "Charities" },
  { href: "/admin/winners", label: "Winners" },
];

export default async function AdminLayout({ children }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-3">
          <span className="mr-4 font-bold text-emerald-400">Admin</span>
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className="rounded-md px-3 py-1 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
              {l.label}
            </Link>
          ))}
          <Link href="/dashboard" className="ml-auto text-sm text-slate-400 hover:text-white">
            ← My dashboard
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}