"use client";

const items = [
  "Systems Architecture",
  "Full-Stack Engineering",
  "0\u21921 Product Development",
  "Cross-Platform Apps",
  "Web3 & Smart Contracts",
  "Solana & Ethereum",
  "Game Development",
  "Agentic Coding",
  "Advanced Prompting",
  "AI-assisted Workflows",
  "Code \u00D7 Product",
  "Best Slack Memes",
  "End-to-End Execution",
  "Good Vibes",
];

export function Marquee() {
  return (
    <div
      className="marquee-wrap overflow-hidden whitespace-nowrap border-y border-[var(--border)]"
      style={{ paddingTop: 20, paddingBottom: 20 }}
      aria-hidden
    >
      <div className="marquee-track">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-14 px-7 text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--muted)] after:content-['·'] after:text-[14px]"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
