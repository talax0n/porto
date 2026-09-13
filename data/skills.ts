export interface Skill {
  name: string;
  category: string;
  /** devicon slug (https://devicon.dev), omitted when no brand icon exists */
  icon?: string;
}

export const SKILLS: Skill[] = [
  { name: "JavaScript", category: "Languages", icon: "javascript" },
  { name: "TypeScript", category: "Languages", icon: "typescript" },
  { name: "Python", category: "Languages", icon: "python" },
  { name: "Go", category: "Languages", icon: "go" },
  { name: "Rust", category: "Languages", icon: "rust" },
  { name: "C#", category: "Languages", icon: "csharp" },
  { name: "Kotlin", category: "Languages", icon: "kotlin" },
  { name: "React", category: "Frontend", icon: "react" },
  { name: "Next.js", category: "Frontend", icon: "nextjs" },
  { name: "Tailwind CSS", category: "Frontend", icon: "tailwindcss" },
  { name: "Gin", category: "Backend", icon: "gin" },
  { name: "Flask", category: "Backend", icon: "flask" },
  { name: "Laravel", category: "Backend", icon: "laravel" },
  { name: "GraphQL", category: "Backend", icon: "graphql" },
  { name: "REST API", category: "Backend" },
  { name: "Docker", category: "DevOps & Deployment", icon: "docker" },
  { name: "Kubernetes", category: "DevOps & Deployment", icon: "kubernetes" },
  { name: "PostgreSQL", category: "Database", icon: "postgresql" },
  { name: "MySQL", category: "Database", icon: "mysql" },
  { name: "Redis", category: "Database", icon: "redis" },
  { name: "Firebase", category: "Database", icon: "firebase" },
  { name: "Git", category: "Tools & Other", icon: "git" },
  { name: "Kali Linux", category: "Tools & Other", icon: "kalilinux" },
  { name: "Android Studio", category: "Tools & Other", icon: "androidstudio" },
  { name: "Unity", category: "Tools & Other", icon: "unity" },
  { name: "Solidity", category: "Blockchain", icon: "solidity" },
  { name: "AI Workflows", category: "Tools & Other" },
];
