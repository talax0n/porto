import { Intro } from "@/components/intro";
import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { Work } from "@/components/work";
import { About } from "@/components/about";
import { Experience } from "@/components/experience";
import { Skills } from "@/components/skills";
import { Awards } from "@/components/awards";
import { Contact } from "@/components/contact";

export default function Home() {
  return (
    <>
      <Intro />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Work />
        <About />
        <Experience />
        <Skills />
        <Awards />
        <Contact />
      </main>
    </>
  );
}
