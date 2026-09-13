"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import StaggeredMenu from "@/components/reactbits/StaggeredMenu";

const LINKS = ["Work", "About", "Experience", "Skills", "Commits", "Awards", "Contact"];
/* the desktop bar gets crowded past four — the rest stay in the mobile menu */
const DESKTOP_LINKS = ["Work", "About", "Skills", "Contact"];

const SECTION_IDS: Record<string, string> = { Commits: "contributions" };

const MENU_ITEMS = LINKS.map((label) => ({
  label,
  ariaLabel: `Go to ${label.toLowerCase()} section`,
  link: `#${SECTION_IDS[label] ?? label.toLowerCase()}`,
}));

const SOCIALS = [
  { label: "GitHub", link: "https://github.com/talax0n" },
  {
    label: "LinkedIn",
    link: "https://linkedin.com/in/theola-aristo-putra-niomba-27708a389",
  },
  { label: "Email", link: "mailto:theo.niomba@gmail.com" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ── Desktop ── */}
      <motion.nav
        className="desktop-nav"
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
          padding: scrolled ? "14px 36px" : "22px var(--pad)",
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
          <ul className="nav-links-list" style={{ display: "flex", gap: 24 }}>
            {DESKTOP_LINKS.map((item) => (
              <li key={item}>
                <a
                  href={`#${SECTION_IDS[item] ?? item.toLowerCase()}`}
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
              border:
                theme === "dark"
                  ? "1px solid var(--border)"
                  : "1px solid var(--border-hover)",
              borderRadius: 9999,
              padding: 8,
              color: theme === "dark" ? "var(--muted)" : "var(--fg)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          />
        </div>
      </motion.nav>

      {/* ── Mobile: staggered slide-in menu ── */}
      <div className="mobile-nav">
        {/* pointerEvents:none — the menu's own children re-enable it, otherwise this
            full-screen layer would swallow every tap on the page */}
        <div style={{ position: "fixed", inset: 0, zIndex: 200, pointerEvents: "none" }}>
          <StaggeredMenu
            isFixed
            position="right"
            logoText="taxal0n"
            items={MENU_ITEMS}
            socialItems={SOCIALS}
            displaySocials
            displayItemNumbering
            accentColor="var(--accent)"
            colors={
              theme === "dark"
                ? ["#1C1917", "#2A2522"]
                : ["#DCD4C4", "#E8E5DD"]
            }
            closeOnClickAway
            onMenuOpen={() => setMenuOpen(true)}
            onMenuClose={() => setMenuOpen(false)}
          />
        </div>

        {/* Theme toggle parked beside the menu button */}
        <AnimatedThemeToggler
          aria-label="Toggle colour scheme"
          className="theme-toggle-btn"
          style={{
            position: "fixed",
            top: 18,
            right: "calc(var(--pad) + 74px)",
            zIndex: 210,
            display: menuOpen ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "1px solid var(--border-hover)",
            borderRadius: 9999,
            padding: 7,
            color: "var(--fg)",
            cursor: "pointer",
          }}
        />
      </div>
    </>
  );
}
