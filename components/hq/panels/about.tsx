import { PROFILE } from "@/data/profile";

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, i) =>
        i % 2 ? (
          <strong key={i} className="font-semibold text-hq-cream">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function AboutPanel() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-display text-3xl font-extrabold max-sm:text-2xl leading-none text-hq-cream">{PROFILE.name}</p>
        <p className="mt-1 font-mono text-[11px] tracking-wider text-hq-amber">
          {PROFILE.role} · {PROFILE.location}
        </p>
        <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#7bd88f]/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#7bd88f]">
          <span className="size-1.5 animate-[hq-pulse_2.2s_ease_infinite] rounded-full bg-[#7bd88f]" />
          Available for work
        </p>
      </div>
      <div className="space-y-2.5 text-[13px] font-light leading-relaxed text-hq-cream/75 max-sm:space-y-2 max-sm:text-[11.5px] max-sm:leading-snug">
        {PROFILE.bio.map((p, i) => (
          <p key={i}>
            <Rich text={p} />
          </p>
        ))}
      </div>
    </div>
  );
}
