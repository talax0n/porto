"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      style={{
        position: "fixed",
        top: scrolled ? 16 : 0,
        left: scrolled ? "22%" : 0,
        right: scrolled ? "22%" : 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: scrolled ? 48 : 0,
        padding: scrolled ? "14px 36px" : "22px 44px",
        borderRadius: scrolled ? 9999 : 0,
        background: scrolled
          ? theme === "dark"
            ? "rgba(12,12,11,0.80)"
            : "rgba(240,237,229,0.85)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.25)" : "none",
        transition: "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <a
        href="#hero"
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
       taxal0n 
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <ul className="nav-links-list" style={{ display: "flex", gap: 28 }}>
          {["Work", "About", "Contact"].map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase()}`}
                className="nav-link"
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: theme === "dark" ? "var(--muted)" : "var(--fg)",
                  transition: "color 0.3s",
                }}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>

        <AnimatedThemeToggler
          aria-label="Toggle colour scheme"
          className="theme-toggle-btn"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: theme === "dark" ? "1px solid var(--border)" : "1px solid var(--border-hover)",
            borderRadius: 9999,
            padding: 8,
            color: theme === "dark" ? "var(--muted)" : "var(--fg)",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
        />
      </div>
    </motion.nav>
  );
}
