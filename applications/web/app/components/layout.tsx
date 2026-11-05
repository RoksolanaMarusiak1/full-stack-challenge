import type { ReactNode } from "react";
import { NavLink } from "react-router";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
  }`;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="text-lg font-bold tracking-tight">
            Shorty
          </NavLink>
          <nav className="flex gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Shorten
            </NavLink>
            <NavLink to="/links" className={navLinkClass}>
              My links
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
    </div>
  );
}
