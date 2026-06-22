"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const navItems = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#other", label: "Other" },
];

export function Navbar() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const onScroll = () => {
      const ids = navItems.map((item) => item.href.replace("#", ""));
      let current = ids[0];
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el && el.getBoundingClientRect().top <= 130) {
          current = ids[i];
          break;
        }
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-6">
      <nav className="section">
        <div className="mx-auto flex h-14 max-w-fit items-center gap-1 rounded-full glass-strong px-6 shadow-xl shadow-black/10">
          {navItems.map((item) => {
            const id = item.href.replace("#", "");
            const isActive = active === id;
            return (
              <a
                key={item.href}
                href={item.href}
                className="relative rounded-full px-5 py-2.5 text-sm font-semibold"
                style={{ color: isActive ? "var(--foreground)" : "var(--muted)" }}
              >
                {isActive ? (
                  <motion.span
                    layoutId="template-nav-indicator"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "var(--accent)",
                      opacity: 0.1,
                      border: "1px solid var(--accent)",
                    }}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                  />
                ) : null}
                <span className="relative z-10">{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
