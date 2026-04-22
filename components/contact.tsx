"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Copy, Check } from "lucide-react";

const EMAIL = "dvd.rod@proton.me";

const socials = [
  { label: "Email", href: `mailto:${EMAIL}` },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/david-rodriguez-product-designer/", external: true },
  { label: "Dribbble", href: "https://dribbble.com/dvdrod", external: true },
  { label: "Gumroad", href: "https://dvdrod.gumroad.com/", external: true },
];

export function Contact() {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section id="contact" className="px-11 pb-20 pt-[120px] max-[900px]:px-6 max-[900px]:py-20">
      <p className="text-[10px] tracking-[0.14em] uppercase text-[var(--muted)]">Get in touch</p>

      {/* Headline */}
      <div
        className="my-14 text-[clamp(52px,9vw,130px)] font-extrabold leading-[0.88] tracking-[-0.045em]"
        style={{ fontFamily: "var(--font-syne), sans-serif" }}
      >
        <span className="block overflow-hidden">
          <motion.span
            className="block"
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Say hi!
          </motion.span>
        </span>
        <span className="block overflow-hidden">
          <motion.span
            className="block"
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.12 }}
          >
            <a
              href={`mailto:${EMAIL}`}
              className="group relative inline-block transition-colors duration-300 hover:text-[var(--accent)]"
            >
              Let&apos;s talk{" "}
              <ArrowUpRight className="mb-[0.12em] inline-block h-[0.7em] w-[0.7em] align-middle" />
              <span className="absolute bottom-1.5 left-0 h-1 w-0 bg-[var(--accent)] transition-all duration-[550ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:w-full" />
            </a>
          </motion.span>
        </span>
      </div>

      {/* Footer */}
      <motion.div
        className="flex items-end justify-between pt-9 max-[900px]:flex-col max-[900px]:items-start max-[900px]:gap-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex flex-col">
          <div className="group flex items-center gap-2">
            <p className="text-[13px] text-[var(--muted)]">{EMAIL}</p>
            <button
              onClick={copyEmail}
              aria-label="Copy email address"
              className={`inline-flex items-center justify-center p-0.5 transition-all duration-200 ${
                copied
                  ? "text-[#00C96B] opacity-100"
                  : "text-[var(--muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--fg)]"
              }`}
            >
              {copied ? <Check className="h-[13px] w-[13px]" /> : <Copy className="h-[13px] w-[13px]" />}
            </button>
          </div>
          <p className="text-[13px] text-[var(--muted)]">Berlin, Germany</p>
        </div>

        <div className="flex gap-6">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.external ? "_blank" : undefined}
              rel={s.external ? "noopener" : undefined}
              className="text-[11px] tracking-[0.1em] uppercase text-[var(--muted)] transition-colors duration-300 hover:text-[var(--fg)]"
            >
              {s.label}
            </a>
          ))}
        </div>
      </motion.div>

      {/* Copyright */}
      <p className="mt-8 border-t border-[var(--border)] pt-8 text-center text-[11px] text-[var(--muted)]">
        &copy; 2026 David Rodriguez &middot; Senior Product Designer
      </p>
    </section>
  );
}
