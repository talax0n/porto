import type { ComponentType } from "react";
import type { StationId } from "@/data/stations";
import { AboutPanel } from "./about";
import { AwardsPanel } from "./awards";
import { ContactPanel } from "./contact";
import { ExperiencePanel } from "./experience";
import { GithubPanel } from "./github";
import { ProjectsPanel } from "./projects";
import { SkillsPanel } from "./skills";
import { UpdatesPanel } from "./updates";

export const PANELS: Record<StationId, ComponentType> = {
  about: AboutPanel,
  projects: ProjectsPanel,
  experience: ExperiencePanel,
  skills: SkillsPanel,
  awards: AwardsPanel,
  github: GithubPanel,
  contact: ContactPanel,
  updates: UpdatesPanel,
};
