"use client";

import { useState } from "react";
import { ArrowUpRight, Copy, Check } from "lucide-react";

const EMAIL = "theo.niomba@gmail.com";

const socials = [
  { label: "Email", href: `mailto:${EMAIL}` },
  { label: "LinkedIn", href: "https://linkedin.com/in/theola-aristo-putra-niomba-27708a389", external: true },
  { label: "GitHub", href: "https://github.com/talax0n", external: true },
];

export function Contact() {
  const [copied, setCopied] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section id="contact" style={{ padding: "120px 44px 80px" }}>
      {/* Label */}
      <p
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        Get in touch
      </p>

      {/* Headline */}
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: "clamp(52px, 9vw, 130px)",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.88,
          margin: "56px 0 72px",
        }}
      >
        <span style={{ display: "block" }}>Say hi!</span>
        <span style={{ display: "block" }}>
          <a
            href={`mailto:${EMAIL}`}
            style={{
              position: "relative",
              display: "inline-block",
              textDecoration: "none",
              color: linkHovered ? "var(--accent)" : "inherit",
              transition: "color 0.3s",
            }}
            onMouseEnter={() => setLinkHovered(true)}
            onMouseLeave={() => setLinkHovered(false)}
          >
            Let&apos;s talk{" "}
            <ArrowUpRight
              style={{
                display: "inline-block",
                width: "0.7em",
                height: "0.7em",
                verticalAlign: "middle",
                marginBottom: "0.12em",
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: 6,
                left: 0,
                height: 4,
                width: linkHovered ? "100%" : "0%",
                background: "var(--accent)",
                transition: "width 0.55s cubic-bezier(0.25,0.46,0.45,0.94)",
              }}
            />
          </a>
        </span>
      </div>

      {/* Footer row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingTop: 36,
        }}
      >
        {/* Left: email + location */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8 }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget.querySelector<HTMLButtonElement>("[data-copy-btn]");
              if (btn && !copied) btn.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget.querySelector<HTMLButtonElement>("[data-copy-btn]");
              if (btn && !copied) btn.style.opacity = "0";
            }}
          >
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{EMAIL}</p>
            <button
              data-copy-btn=""
              onClick={copyEmail}
              aria-label="Copy email address"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                padding: 2,
                color: copied ? "#00C96B" : "var(--muted)",
                opacity: copied ? 1 : 0,
                transition: "opacity 0.2s ease, color 0.2s ease",
                cursor: "pointer",
              }}
            >
              {copied ? <Check style={{ width: 13, height: 13 }} /> : <Copy style={{ width: 13, height: 13 }} />}
            </button>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>Tangerang, Indonesia</p>
        </div>

        {/* Right: social links */}
        <div style={{ display: "flex", gap: 24 }}>
          {socials.map((s) => (
            <SocialLink key={s.label} {...s} />
          ))}
        </div>
      </div>

      {/* Copyright */}
      <p
        style={{
          marginTop: 32,
          borderTop: "1px solid var(--border)",
          paddingTop: 32,
          textAlign: "center",
          fontSize: 11,
          color: "var(--muted)",
        }}
      >
        &copy; 2026 Theo Niomba &middot; Fullstack Engineer      </p>
    </section>
  );
}

function SocialLink({ label, href, external }: { label: string; href: string; external?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener" : undefined}
      style={{
        fontSize: 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: hovered ? "var(--fg)" : "var(--muted)",
        transition: "color 0.3s",
        textDecoration: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </a>
  );
}
