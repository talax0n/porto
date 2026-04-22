"use client";

const items = [
  "Systems Thinking",
  "Design Systems",
  "0\u21921 Product Work",
  "Cross-functional",
  "Data-informed Design",
  "Prototyping",
  "A/B Testing",
  "Research & Synthesis",
  "Best Slack Memes",
  "Stakeholder Alignment",
  "Design \u00D7 Engineering",
  "AI-assisted Workflows",
  "Product Strategy",
  "Good Vibes",
];

export function Marquee() {
  return (
    <div
      className="marquee-wrap overflow-hidden whitespace-nowrap border-y border-[var(--border)] py-3.5"
      aria-hidden
    >
      <div className="marquee-track">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-14 px-7 text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--muted)] after:content-['\u2726'] after:text-[7px]"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
