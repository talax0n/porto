export interface Project {
  num: string;
  title: string;
  description: string;
  techStack: string[];
  gradient: string;
  image: string;
  href: string;
  github: string;
}

export const PROJECTS: Project[] = [
  {
    num: "01",
    title: "SolHedge",
    description:
      "\"All LPs, One Shield.\" SolHedge turns market ups and downs into steady income with AI-powered, automated hedging for Solana LPs, protecting Meteora DLMM liquidity positions from impermanent loss.",
    techStack: ["Bun", "TypeScript", "Solana", "Meteora DLMM", "PostgreSQL", "Redis"],
    gradient: "linear-gradient(145deg, #001A0A 0%, #004A20 55%, #00A854 100%)",
    image: "/projects/solhedge.png",
    href: "https://solhedge.xyz/",
    github: "",
  },
  {
    num: "02",
    title: "XFlare",
    description:
      "AI-powered grid spot trading platform. Maximizes trading profits with intelligent AI rebalancing for grid trading and automatic hedging protection, powered by OKX Exchange infrastructure.",
    techStack: ["Next.js", "TypeScript", "Turborepo", "Tailwind CSS", "Zustand"],
    gradient: "linear-gradient(145deg, #001209 0%, #003D1A 55%, #00C96B 100%)",
    image: "/projects/xflare.png",
    href: "https://xflare.app/",
    github: "",
  },
  {
    num: "03",
    title: "SpektrumTCG",
    description:
      "\"Collect · Strategize · Battle.\" A 1v1 turn-based trading card game with on-chain card ownership on Solana, building decks around elemental Avatars, trading NFT cards, and battling through Privy embedded wallets that stay out of the way of the game.",
    techStack: ["Solana", "Privy", "React Native", "Godot", "TypeScript"],
    gradient: "linear-gradient(145deg, #001A0A 0%, #004A20 55%, #00A854 100%)",
    image: "/projects/spektrum.png",
    href: "https://spektrumtcg.com/",
    github: "",
  },
  {
    num: "04",
    title: "Panora",
    description:
      "Tech-enabled commodity aggregator and transparent supply-chain infrastructure connecting Indonesian smallholder farmers with global B2B buyers. GPS polygon farm mapping, tamper-evident Digital Product Passports, and one-click EUDR compliance reporting, covering coffee, cocoa, coconut, and horticulture across 2,800+ hectares and 3,500+ farmers.",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS"],
    gradient: "linear-gradient(145deg, #001209 0%, #003D1A 55%, #00C96B 100%)",
    image: "/projects/panora.png",
    href: "https://panora.farm/",
    github: "",
  },
  {
    num: "05",
    title: "Verdana Protocol",
    description:
      "\"The Trust Layer for Green Assets.\" Turns plastic waste into verified digital assets: track, verify, and monetize recycled plastic transparently on Solana. A mobile operator app records waste batches, a Go backend grades and queues them, and a Rust relayer mints compressed NFTs as proof of collection.",
    techStack: ["Go", "Rust", "Expo", "Solana", "compressed NFTs"],
    gradient: "linear-gradient(145deg, #001A0A 0%, #004A20 55%, #00A854 100%)",
    image: "/projects/verdana.png",
    href: "https://verdanaprotocol.com/",
    github: "",
  },
  {
    num: "06",
    title: "Octora",
    description:
      "Privacy layer for LP trades on Meteora: let your main wallet stay invisible. An anti-copy-LP trading desk that routes positions through backend-owned rotating wallets, scores subscriber-mirroring risk with a live detector, and exits through direct or privacy-shielded paths with no auto-executed action.",
    techStack: ["Next.js", "Fastify", "Rust", "Solana", "Meteora DLMM"],
    gradient: "linear-gradient(145deg, #001209 0%, #003D1A 55%, #00C96B 100%)",
    image: "/projects/octora.png",
    href: "https://www.octora.xyz/",
    github: "",
  },
];
