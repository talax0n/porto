import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { PROFILE } from "@/data/profile";

export function ContactPanel() {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard.writeText(PROFILE.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });

  return (
    <div className="flex h-full flex-col gap-4">
      <p className="font-display text-3xl font-extrabold leading-[0.95] text-hq-cream">
        Say hi!
        <br />
        <a href={`mailto:${PROFILE.email}`} className="text-hq-amber hover:underline">
          Let&apos;s talk <ArrowUpRight className="inline size-6" />
        </a>
      </p>
      <div className="flex items-center gap-2 font-mono text-xs text-hq-cream/80">
        {PROFILE.email}
        <button type="button" onClick={copy} aria-label="Copy email address" className="rounded p-1 hover:bg-hq-line">
          {copied ? <Check className="size-3.5 text-[#7bd88f]" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <p className="font-mono text-xs text-hq-cream/60">{PROFILE.location}</p>
      <ul className="flex flex-wrap gap-2">
        {PROFILE.links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded border border-hq-amber/50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-hq-amber hover:bg-hq-amber hover:text-hq-bg"
            >
              {l.label} <ArrowUpRight className="size-3" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-auto text-[11px] text-hq-cream/40">© 2026 Theo Niomba · {PROFILE.role}</p>
    </div>
  );
}
