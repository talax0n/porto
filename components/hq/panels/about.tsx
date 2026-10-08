import { PROFILE } from "@/data/profile";

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, i) =>
        i % 2 ? (
          <strong key={i} className="font-semibold text-hq-ink">
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
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-hq-mute">
        {PROFILE.role} · {PROFILE.location}
      </p>
      <p className="inline-flex w-fit items-center gap-2 rounded-full border border-hq-line px-3 py-1 text-[11px] text-hq-ink">
        <span className="size-1.5 rounded-full bg-hq-accent" />
        Available for work
      </p>
      <div className="space-y-2.5 text-[13px] leading-relaxed text-hq-mute max-sm:space-y-2 max-sm:text-[12px] max-sm:leading-snug">
        {PROFILE.bio.map((p, i) => (
          <p key={i}>
            <Rich text={p} />
          </p>
        ))}
      </div>
    </div>
  );
}
