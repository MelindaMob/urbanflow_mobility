"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/plan",
    label: "Planificateur",
    description: "Itinéraires multimodaux",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 6.5 9 3l6 3.5 6-3.5v11L15 21l-6-3.5L3 17.5V6.5z" strokeLinejoin="round" />
        <path d="M9 3v14M15 6.5V21" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "Trajets",
    description: "Historique sauvegardé",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/carbon",
    label: "Empreinte",
    description: "Impact carbone",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 21c-4-3-7-6-7-10a7 7 0 0 1 14 0c0 4-3 7-7 10z" strokeLinejoin="round" />
        <path d="M12 11v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Préférences",
    description: "Profil mobilité",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-4 py-6 space-y-1.5">
      <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
        Navigation
      </p>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
              isActive
                ? "bg-mobility-green/10 text-mobility-green shadow-sm ring-1 ring-mobility-green/20"
                : "text-neutral-600 hover:bg-neutral-50 hover:text-anthracite"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? "bg-mobility-green text-white"
                  : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200 group-hover:text-anthracite"
              }`}
            >
              {item.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight">{item.label}</span>
              <span
                className={`block text-[11px] leading-tight mt-0.5 truncate ${
                  isActive ? "text-mobility-green/70" : "text-neutral-400"
                }`}
              >
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
