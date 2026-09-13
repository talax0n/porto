"use client";

import { useState } from "react";
import { Code2 } from "lucide-react";

export function SkillIcon({ name, icon }: { name: string; icon?: string }) {
  const [broken, setBroken] = useState(!icon);

  if (broken) {
    return <Code2 size={14} aria-hidden="true" className="text-[var(--muted)]" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external devicon CDN, not an optimizable local asset
    <img
      src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${icon}/${icon}-original.svg`}
      alt=""
      title={name}
      aria-hidden="true"
      width={14}
      height={14}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
