"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, Plus, X, Upload, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";

/* ── Types ── */
interface Project {
  id: string;
  num: string;
  title: string;
  category: string;
  techStack: string[];
  gradient: string;
  image: string;
  href: string;
  wip: boolean;
}
interface Experience {
  id: string;
  company: string;
  role: string;
  years: string;
}
interface Award {
  id: string;
  title: string;
  issuer: string;
  year: string;
}

type Tab = "projects" | "experience" | "awards" | "skills" | "cv";

/* ── Helpers ── */
async function api(path: string, opts?: RequestInit) {
  const res = await fetch(path, opts);
  return res.json();
}

/* ── Inline form styling ── */
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  fontSize: "15px",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
  background: "var(--bg)",
  color: "var(--fg)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: "8px",
  display: "block",
};

const btnPrimary: React.CSSProperties = {
  padding: "12px 28px",
  fontSize: "13px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontWeight: 600,
  background: "var(--fg)",
  color: "var(--bg)",
  border: "none",
  borderRadius: "100px",
  cursor: "pointer",
  transition: "opacity 0.2s",
};

const btnGhost: React.CSSProperties = {
  padding: "12px 22px",
  fontSize: "13px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  fontWeight: 600,
  background: "none",
  color: "var(--muted)",
  border: "1px solid var(--border)",
  borderRadius: "100px",
  cursor: "pointer",
  transition: "all 0.2s",
};

/* ── Main ── */
export default function AdminDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [tab, setTab] = useState<Tab>("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [cvExists, setCvExists] = useState(false);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [editingAward, setEditingAward] = useState<Award | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [showForm, setShowForm] = useState(false);

  /* Check auth on mount */
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const handleLogin = async () => {
    setAuthError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      setAuthError("Wrong password");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthed(false);
    setPassword("");
  };

  const load = useCallback(async () => {
    const [p, e, a, s, c] = await Promise.all([
      api("/api/projects"),
      api("/api/experience"),
      api("/api/awards"),
      api("/api/skills"),
      api("/api/cv"),
    ]);
    setProjects(p);
    setExperience(e);
    setAwards(a);
    setSkills(s);
    setCvExists(c.exists);
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  const resetForm = () => {
    setEditingProject(null);
    setEditingExp(null);
    setEditingAward(null);
    setShowForm(false);
  };

  /* ── Projects CRUD ── */
  const saveProject = async (p: Project) => {
    const isNew = !p.id || p.id === "new";
    const { id, num, ...body } = p;
    await api("/api/projects", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isNew ? body : p),
    });
    resetForm();
    load();
  };
  const deleteProject = async (id: string) => {
    await api("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  /* ── Experience CRUD ── */
  const saveExp = async (e: Experience) => {
    const isNew = !e.id || e.id === "new";
    const { id, ...body } = e;
    await api("/api/experience", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isNew ? body : e),
    });
    resetForm();
    load();
  };
  const deleteExp = async (id: string) => {
    await api("/api/experience", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  /* ── Awards CRUD ── */
  const saveAward = async (a: Award) => {
    const isNew = !a.id || a.id === "new";
    const { id, ...body } = a;
    await api("/api/awards", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isNew ? body : a),
    });
    resetForm();
    load();
  };
  const deleteAward = async (id: string) => {
    await api("/api/awards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  /* ── Skills ── */
  const addSkill = async () => {
    if (!newSkill.trim()) return;
    await api("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: newSkill.trim() }),
    });
    setNewSkill("");
    load();
  };
  const removeSkill = async (s: string) => {
    await api("/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: s }),
    });
    load();
  };

  /* ── CV Upload ── */
  const uploadCV = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    await api("/api/cv", { method: "POST", body: fd });
    load();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "projects", label: "Projects" },
    { key: "experience", label: "Experience" },
    { key: "awards", label: "Awards" },
    { key: "skills", label: "Skills" },
    { key: "cv", label: "CV" },
  ];

  /* Loading */
  if (authed === null) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p>
      </div>
    );
  }

  /* Login screen */
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 360, padding: "0 24px" }}>
          <h1
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "32px" }}>
            Enter password to continue
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              style={inputStyle}
            />
            {authError && (
              <p style={{ fontSize: "13px", color: "#ef4444" }}>{authError}</p>
            )}
            <button type="submit" style={btnPrimary}>
              Sign In
            </button>
          </form>
          <Link
            href="/"
            style={{ display: "inline-block", marginTop: "24px", fontSize: "13px", color: "var(--muted)", textDecoration: "none" }}
          >
            &larr; Back to portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)" }}>
      {/* Header */}
      <header
        style={{
          padding: "36px 60px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        className="max-[600px]:!px-5"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "100px",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              transition: "all 0.2s",
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: "32px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              Dashboard
            </h1>
            <p style={{ fontSize: "14px", color: "var(--muted)", marginTop: "4px" }}>
              Manage your portfolio content
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            ...btnGhost,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </header>

      <div style={{ display: "flex", maxWidth: 1200, margin: "0 auto", padding: "56px 60px" }} className="max-[600px]:!flex-col max-[600px]:!px-5 max-[600px]:!py-6 max-[600px]:!gap-6">
        {/* Sidebar tabs */}
        <nav
          style={{
            width: 200,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            marginRight: "64px",
          }}
          className="max-[600px]:!flex-row max-[600px]:!w-full max-[600px]:!mr-0 max-[600px]:!gap-1 max-[600px]:!overflow-x-auto max-[600px]:!pb-2"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); resetForm(); }}
              style={{
                padding: "12px 18px",
                fontSize: "15px",
                fontWeight: tab === t.key ? 600 : 400,
                letterSpacing: "0.02em",
                textAlign: "left",
                background: tab === t.key ? "var(--bg2)" : "transparent",
                color: tab === t.key ? "var(--fg)" : "var(--muted)",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* ── Projects ── */}
          {tab === "projects" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                  Projects
                </h2>
                <button
                  onClick={() => {
                    setEditingProject({ id: "new", num: "", title: "", category: "", techStack: [], gradient: "linear-gradient(145deg, #001A0A 0%, #004A20 55%, #00A854 100%)", image: "", href: "", wip: false });
                    setShowForm(true);
                  }}
                  style={btnGhost}
                >
                  <Plus size={15} style={{ marginRight: 6, display: "inline" }} />
                  Add
                </button>
              </div>

              {showForm && editingProject && (
                <ProjectForm
                  project={editingProject}
                  onSave={saveProject}
                  onCancel={resetForm}
                />
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "22px 0",
                      borderBottom: "1px solid var(--border)",
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, letterSpacing: "0.1em" }}>
                          {p.num}
                        </span>
                        <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "17px", fontWeight: 700 }}>
                          {p.title.replace(/\n/g, " ")}
                        </span>
                        {p.wip && (
                          <span style={{ fontSize: "11px", color: "#F59E0B", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                            WIP
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "14px", color: "var(--muted)", marginTop: "2px", display: "block" }}>
                        {p.category}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button
                        onClick={() => { setEditingProject(p); setShowForm(true); }}
                        style={{ ...btnGhost, padding: "10px 18px", fontSize: "12px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProject(p.id)}
                        style={{ ...btnGhost, padding: "10px 14px", color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Experience ── */}
          {tab === "experience" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                  Experience
                </h2>
                <button
                  onClick={() => { setEditingExp({ id: "new", company: "", role: "", years: "" }); setShowForm(true); }}
                  style={btnGhost}
                >
                  <Plus size={15} style={{ marginRight: 6, display: "inline" }} />
                  Add
                </button>
              </div>

              {showForm && editingExp && (
                <ExpForm exp={editingExp} onSave={saveExp} onCancel={resetForm} />
              )}

              <div style={{ display: "flex", flexDirection: "column" }}>
                {experience.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "22px 0",
                      borderBottom: "1px solid var(--border)",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "17px", fontWeight: 700, display: "block" }}>
                        {e.company}
                      </span>
                      <span style={{ fontSize: "14px", color: "var(--muted)" }}>
                        {e.role} — {e.years}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button
                        onClick={() => { setEditingExp(e); setShowForm(true); }}
                        style={{ ...btnGhost, padding: "10px 18px", fontSize: "12px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteExp(e.id)}
                        style={{ ...btnGhost, padding: "10px 14px", color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Awards ── */}
          {tab === "awards" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                  Awards
                </h2>
                <button
                  onClick={() => { setEditingAward({ id: "new", title: "", issuer: "", year: "" }); setShowForm(true); }}
                  style={btnGhost}
                >
                  <Plus size={15} style={{ marginRight: 6, display: "inline" }} />
                  Add
                </button>
              </div>

              {showForm && editingAward && (
                <AwardForm award={editingAward} onSave={saveAward} onCancel={resetForm} />
              )}

              <div style={{ display: "flex", flexDirection: "column" }}>
                {awards.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "22px 0",
                      borderBottom: "1px solid var(--border)",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "17px", fontWeight: 700, display: "block" }}>
                        {a.title}
                      </span>
                      <span style={{ fontSize: "14px", color: "var(--muted)" }}>
                        {a.issuer} — {a.year}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button
                        onClick={() => { setEditingAward(a); setShowForm(true); }}
                        style={{ ...btnGhost, padding: "10px 18px", fontSize: "12px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAward(a.id)}
                        style={{ ...btnGhost, padding: "10px 14px", color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Skills ── */}
          {tab === "skills" && (
            <div>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "32px" }}>
                Skills
              </h2>

              <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Add a skill..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={addSkill} style={btnPrimary}>
                  Add
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {skills.map((s) => (
                  <span
                    key={s}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "14px",
                      padding: "10px 18px",
                      border: "1px solid var(--border)",
                      borderRadius: "100px",
                      color: "var(--muted)",
                    }}
                  >
                    {s}
                    <button
                      onClick={() => removeSkill(s)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0, display: "flex" }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── CV ── */}
          {tab === "cv" && (
            <div>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "32px" }}>
                CV / Resume
              </h2>

              <div
                style={{
                  border: "1px dashed var(--border)",
                  borderRadius: "14px",
                  padding: "60px",
                  textAlign: "center",
                }}
              >
                <Upload size={32} style={{ margin: "0 auto 16px", color: "var(--muted)" }} />
                <p style={{ fontSize: "16px", color: "var(--muted)", marginBottom: "6px" }}>
                  {cvExists ? "CV file exists. Upload to replace." : "No CV uploaded yet."}
                </p>
                <p style={{ fontSize: "14px", color: "var(--muted)", opacity: 0.6, marginBottom: "24px" }}>
                  PDF only
                </p>
                <label style={{ ...btnPrimary, display: "inline-block", cursor: "pointer" }}>
                  Choose File
                  <input
                    type="file"
                    accept=".pdf"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadCV(file);
                    }}
                  />
                </label>
                {cvExists && (
                  <a
                    href="/cv.pdf"
                    target="_blank"
                    rel="noopener"
                    style={{ ...btnGhost, display: "inline-block", marginLeft: "8px", textDecoration: "none" }}
                  >
                    View Current
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Project Form ── */
function ProjectForm({ project, onSave, onCancel }: { project: Project; onSave: (p: Project) => void; onCancel: () => void }) {
  const [form, setForm] = useState(project);
  const [techInput, setTechInput] = useState(project.techStack.join(", "));

  return (
    <div style={{ padding: "28px", border: "1px solid var(--border)", borderRadius: "14px", marginBottom: "32px", background: "var(--bg2)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="max-[600px]:!grid-cols-1">
        <div>
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Category</label>
          <input style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Tech Stack (comma separated)</label>
          <input style={inputStyle} value={techInput} onChange={(e) => setTechInput(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Gradient CSS</label>
          <input style={inputStyle} value={form.gradient} onChange={(e) => setForm({ ...form, gradient: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Image Path</label>
          <input style={inputStyle} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/projects/example.jpg" />
        </div>
        <div>
          <label style={labelStyle}>Link (href)</label>
          <input style={inputStyle} value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} placeholder="/project-slug" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input type="checkbox" checked={form.wip} onChange={(e) => setForm({ ...form, wip: e.target.checked })} id="wip" />
          <label htmlFor="wip" style={{ fontSize: "14px", color: "var(--muted)" }}>Work in Progress</label>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
        <button
          onClick={() => onSave({ ...form, techStack: techInput.split(",").map((s) => s.trim()).filter(Boolean) })}
          style={btnPrimary}
        >
          Save
        </button>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

/* ── Experience Form ── */
function ExpForm({ exp, onSave, onCancel }: { exp: Experience; onSave: (e: Experience) => void; onCancel: () => void }) {
  const [form, setForm] = useState(exp);
  return (
    <div style={{ padding: "28px", border: "1px solid var(--border)", borderRadius: "14px", marginBottom: "32px", background: "var(--bg2)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="max-[600px]:!grid-cols-1">
        <div>
          <label style={labelStyle}>Company</label>
          <input style={inputStyle} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Role</label>
          <input style={inputStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Period</label>
          <input style={inputStyle} value={form.years} onChange={(e) => setForm({ ...form, years: e.target.value })} placeholder="Jan 2025 - Now" />
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
        <button onClick={() => onSave(form)} style={btnPrimary}>Save</button>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

/* ── Award Form ── */
function AwardForm({ award, onSave, onCancel }: { award: Award; onSave: (a: Award) => void; onCancel: () => void }) {
  const [form, setForm] = useState(award);
  return (
    <div style={{ padding: "28px", border: "1px solid var(--border)", borderRadius: "14px", marginBottom: "32px", background: "var(--bg2)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="max-[600px]:!grid-cols-1">
        <div>
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Issuer</label>
          <input style={inputStyle} value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Year</label>
          <input style={inputStyle} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="Apr 2026" />
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
        <button onClick={() => onSave(form)} style={btnPrimary}>Save</button>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
      </div>
    </div>
  );
}
