"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { en: "Features", href: "#features" },
  { en: "Resources", href: "#resources" },
  { en: "Pricing", href: "#pricing" },
  { en: "Career", href: "#career" },
  { en: "Contact", href: "#contact" },
  {en : "Feedbacks", href : "/feedbacks"}
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {/* logo.png — place it in /public/logo.png */}
          <div className="w-9 h-9 rounded-2xl bg-accent flex items-center justify-center shadow-sm overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="DineX"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                (e.currentTarget.parentElement as HTMLElement).innerHTML =
                  '<span style="font-size:18px;font-weight:900;color:var(--accent-foreground)">D</span>';
              }}
            />
          </div>
          <div className="leading-none">
            <div className="text-base font-black tracking-tight text-foreground">DineX</div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Nepal&apos;s #1 POS
            </div>
          </div>
        </Link>

        {/* Desktop center nav */}
        <ul className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-lg transition-all duration-150 font-medium"
              >
                {l.en}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium border border-border bg-transparent hover:bg-muted rounded-xl transition-colors"
          >
            Login
          </Link>
          <a
            href="#"
            className="inline-flex items-center justify-center h-9 px-5 text-sm font-bold bg-accent text-accent-foreground hover:bg-accent/85 active:scale-[0.98] rounded-xl transition-all shadow-sm whitespace-nowrap"
          >
            Start For Free
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden w-9 h-9 rounded-xl border border-border bg-muted/40 flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 pb-5 pt-3">
          <ul className="flex flex-col gap-0.5 mb-4">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-medium"
                >
                  {l.en}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            <Link
              href="/login"
              className="flex items-center justify-center h-10 text-sm font-medium border border-border rounded-xl hover:bg-muted transition-colors"
            >
              Login
            </Link>
            <a
              href="#"
              className="flex items-center justify-center h-10 text-sm font-bold bg-accent text-accent-foreground rounded-xl hover:bg-accent/85 transition-all shadow-sm"
            >
              Start For Free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}