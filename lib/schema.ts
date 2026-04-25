import { pgTable, text, boolean, serial } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  num: text("num").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  techStack: text("tech_stack").array().notNull().default([]),
  gradient: text("gradient").notNull().default(""),
  image: text("image").notNull().default(""),
  href: text("href").notNull().default(""),
  github: text("github").notNull().default(""),
  wip: boolean("wip").notNull().default(false),
});

export const experience = pgTable("experience", {
  id: serial("id").primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  years: text("years").notNull(),
});

export const awards = pgTable("awards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  issuer: text("issuer").notNull(),
  year: text("year").notNull(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});
