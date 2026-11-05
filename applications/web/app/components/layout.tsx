import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { ThemeToggle } from "./theme-toggle";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-card text-accent-strong"
      : "text-ink-soft hover:text-ink"
  }`;

export function Layout({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  // The links table needs more room than the form pages.
  const width = wide ? "max-w-5xl" : "max-w-3xl";
  return (
    <div className="relative min-h-screen bg-paper text-ink">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-blob bg-blob-a" />
        <div className="bg-blob bg-blob-b" />
        <div className="bg-blob bg-blob-c" />
      </div>
      <header className="relative border-b border-line">
        <div className={`mx-auto flex ${width} items-center justify-between px-4 py-4`}>
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span aria-hidden className="inline-block size-2.5 rounded-full bg-accent shadow-[0_0_10px_2px_var(--accent)]" />
            Shorty
          </NavLink>
          <div className="flex items-center gap-2">
            <nav className="flex gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Shorten
              </NavLink>
              <NavLink to="/links" className={navLinkClass}>
                My links
              </NavLink>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className={`relative mx-auto ${width} px-4 py-10 sm:py-14`}>{children}</main>
    </div>
  );
}
