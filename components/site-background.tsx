"use client";

import { useEffect, useState } from "react";
import GradientWaves from "@/components/reactbits/GradientWaves";
import { useTheme } from "@/components/theme-provider";

/* Palettes tuned against --bg / --fg in globals.css */
const PALETTE = {
  light: { horizonColor: "#EDE0CB", waveColor: "#D2600F", crestColor: "#FFEBD6" },
  dark: { horizonColor: "#0C0C0B", waveColor: "#4A2A18", crestColor: "#FF5A2A" },
} as const;

export function SiteBackground() {
  const { theme } = useTheme();
  // ponytail: one media query, no resize listener — detail only needs to be right at mount
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px), (prefers-reduced-motion: reduce)");
    const sync = () => setLite(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: "var(--bg)" }}
    >
      <GradientWaves
        {...PALETTE[theme]}
        speed={lite ? 0.2 : 0.35}
        amplitude={2.5}
        waveScale={0.6}
        waveRatio={0.9}
        swell={35}
        turbulence={20}
        tilt={1.11}
        zoom={1}
        height={5.5}
        fogDepth={28}
        detail={lite ? "low" : "medium"}
        brightness={theme === "dark" ? 0.9 : 1.05}
        opacity={theme === "dark" ? 0.75 : 0.92}
        grain
        grainIntensity={0.05}
        mouseInteraction={!lite}
        parallaxStrength={0.35}
      />
      {/* legibility scrim — dark needs more of it, the ember waves run hot */}
      <div
        className="absolute inset-0"
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(to bottom, color-mix(in srgb, var(--bg) 25%, transparent), color-mix(in srgb, var(--bg) 60%, transparent))"
              : "linear-gradient(to bottom, color-mix(in srgb, var(--bg) 4%, transparent), color-mix(in srgb, var(--bg) 30%, transparent))",
        }}
      />
    </div>
  );
}
