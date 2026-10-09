import { VILLAGERS } from "@/components/hq/scene/folk";
import { STATIONS } from "./stations";

export interface IntroLine {
  text: string;
  /** replaces `text` on touch screens, where there are no keys to press */
  touch?: string;
}

/** What the player character says on a first visit, one bubble per step. */
export const INTRO: readonly IntroLine[] = [
  { text: "Hi! I'm Theo. Welcome to my tiny world." },
  {
    text: "Each little building holds a piece of my story. Walk up and press E.",
    touch: "Each little building holds a piece of my story. Walk up and tap to open.",
  },
  { text: `Light up all ${STATIONS.length}, and say hi to the ${VILLAGERS} folks who live here.` },
  {
    text: "WASD or click to walk. Ready? Here I go!",
    touch: "Tap anywhere to walk. Ready? Here I go!",
  },
];
