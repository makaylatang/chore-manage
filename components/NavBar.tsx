"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavBar() {
  const pathname = usePathname();
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    fetch("/api/overdue")
      .then((r) => r.json())
      .then((d) => setOverdueCount(d.count))
      .catch(() => {});
  }, [pathname]);

  const links = [
    { href: "/", label: "Calendar" },
    { href: "/chores", label: "Chores" },
    { href: "/team", label: "Team" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-6">
        <span className="font-bold text-lg text-blue-700 mr-4">
          Office Chores
        </span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium px-3 py-1 rounded transition-colors ${
              pathname === l.href
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-blue-700 hover:bg-gray-100"
            }`}
          >
            {l.label}
          </Link>
        ))}
        {overdueCount > 0 && (
          <span className="ml-auto flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full inline-block" />
            {overdueCount} overdue
          </span>
        )}
      </div>
    </nav>
  );
}
