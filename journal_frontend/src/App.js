import React, { useEffect, useMemo, useState } from "react";
import "./theme.css";
import { api } from "./api/client";

// Simple utility to format timestamp if present
const fmt = (s) => {
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  } catch {
    return "";
  }
};

// PUBLIC_INTERFACE
function App() {
  /** This is the main application: handles auth (login/register),
   * lists and manages journal entries with create/edit/delete.
   * It reads API base URL from env through the api client (default http://localhost:3001).
   */

  const apiBase = api.getApiBase();
  const [authView, setAuthView] = useState("login"); // login | register
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Form states
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [draft, setDraft] = useState({ id: null, title: "", content: "" });

  const hasBackend = useMemo(() => Boolean(apiBase), [apiBase]);

  const loadMe = async () => {
    setErr("");
    try {
      const me = await api.me();
      setUser(me);
    } catch (e) {
      // ignore when unauthenticated
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    setErr("");
    try {
      const list = await api.listEntries();
      setEntries(Array.isArray(list) ? list : (list.items || []));
    } catch (e) {
      setErr(e?.message || "Failed to load entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attempt to load user on mount if token exists
    loadMe().then(() => {
      if (user) loadEntries();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onLogin = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api.login(loginForm);
      await loadMe();
    } catch (e1) {
      setErr(e1?.message || "Login failed");
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api.register(registerForm);
      // Auto switch to login after successful register
      setAuthView("login");
      setLoginForm({ email: registerForm.email, password: registerForm.password });
    } catch (e1) {
      setErr(e1?.message || "Registration failed");
    }
  };

  const onLogout = async () => {
    await api.logout();
    setUser(null);
    setEntries([]);
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const created = await api.createEntry({ title: draft.title, content: draft.content });
      setDraft({ id: null, title: "", content: "" });
      setEntries((prev) => [created, ...prev]);
    } catch (e1) {
      setErr(e1?.message || "Create failed");
    }
  };

  const onSelectEdit = (entry) => {
    setDraft({ id: entry.id, title: entry.title || "", content: entry.content || "" });
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    if (!draft.id) return;
    setErr("");
    try {
      const updated = await api.updateEntry(draft.id, { title: draft.title, content: draft.content });
      setEntries((prev) => prev.map((it) => (it.id === draft.id ? updated : it)));
      setDraft({ id: null, title: "", content: "" });
    } catch (e1) {
      setErr(e1?.message || "Update failed");
    }
  };

  const onDelete = async (id) => {
    setErr("");
    try {
      await api.deleteEntry(id);
      setEntries((prev) => prev.filter((it) => it.id !== id));
    } catch (e1) {
      setErr(e1?.message || "Delete failed");
    }
  };

  return (
    <div className="app-shell">
      <header className="header">
        <div className="brand" role="banner" aria-label="Personal Journal Manager">
          <div className="brand-badge">📘</div>
          <div>
            Personal Journal
            <div style={{ fontSize: 12, color: "var(--ocean-muted)", fontWeight: 500 }}>
              Ocean Professional
            </div>
          </div>
        </div>
        <div className="api-hint" title="Resolved backend base URL">
          API: {apiBase}
        </div>
      </header>

      <div className="main">
        <aside className="sidebar card" aria-label="Quick links">
          <div className="section-title">Quick Links</div>
          {!user && (
            <>
              <a href="#login" className="quick-link" onClick={() => setAuthView("login")}>
                Login
              </a>
              <a href="#register" className="quick-link" onClick={() => setAuthView("register")}>
                Register
              </a>
            </>
          )}
          {user && (
            <>
              <div className="notice" style={{ marginBottom: 10 }}>
                Signed in as <strong>{user.name || user.email || "User"}</strong>
              </div>
              <button className="btn" onClick={onLogout} aria-label="Logout">
                Logout
              </button>
            </>
          )}
        </aside>

        <main className="content">
          {!hasBackend && (
            <div className="card alert" role="alert" style={{ padding: 16 }}>
              Backend base URL not configured. The app will default to http://localhost:3001.
              Set REACT_APP_API_BASE in .env to override.
            </div>
          )}

          {!user ? (
            <section className="card auth-card" aria-label="Authentication">
              <div className="toolbar">
                <div>
                  <div className="auth-title">
                    {authView === "login" ? "Welcome back" : "Create your account"}
                  </div>
                  <div className="auth-subtitle">
                    {authView === "login"
                      ? "Sign in to manage your personal journal."
                      : "Register to start writing your journal entries."}
                  </div>
                </div>
                <div>
                  <button
                    className="btn"
                    onClick={() => setAuthView(authView === "login" ? "register" : "login")}
                  >
                    {authView === "login" ? "Need an account?" : "Have an account?"}
                  </button>
                </div>
              </div>
              <div style={{ padding: 16 }}>
                {err && (
                  <div className="alert" role="alert" style={{ marginBottom: 12 }}>
                    {err}
                  </div>
                )}

                {authView === "login" ? (
                  <form onSubmit={onLogin} className="row" aria-label="Login form">
                    <label>
                      <div>Email</div>
                      <input
                        className="input"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm((s) => ({ ...s, email: e.target.value }))}
                        placeholder="you@example.com"
                        required
                      />
                    </label>
                    <label>
                      <div>Password</div>
                      <input
                        className="input"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))}
                        placeholder="••••••••"
                        required
                      />
                    </label>
                    <div>
                      <button className="btn btn-primary" type="submit">
                        Sign in
                      </button>
                    </div>
                    <div className="footer-note">
                      Use the same credentials you registered with in the backend.
                    </div>
                  </form>
                ) : (
                  <form onSubmit={onRegister} className="row" aria-label="Register form">
                    <div className="row">
                      <label>
                        <div>Name</div>
                        <input
                          className="input"
                          type="text"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm((s) => ({ ...s, name: e.target.value }))}
                          placeholder="Your name"
                          required
                        />
                      </label>
                    </div>
                    <label>
                      <div>Email</div>
                      <input
                        className="input"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm((s) => ({ ...s, email: e.target.value }))}
                        placeholder="you@example.com"
                        required
                      />
                    </label>
                    <label>
                      <div>Password</div>
                      <input
                        className="input"
                        type="password"
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm((s) => ({ ...s, password: e.target.value }))
                        }
                        placeholder="Create a strong password"
                        required
                      />
                    </label>
                    <div>
                      <button className="btn btn-primary" type="submit">
                        Create account
                      </button>
                    </div>
                    <div className="footer-note">
                      After registering, sign in to start writing entries.
                    </div>
                  </form>
                )}
              </div>
            </section>
          ) : (
            <section className="card" aria-label="Journal entries">
              <div className="toolbar">
                <div>
                  <strong>Journal Entries</strong>
                  <div className="meta">Create, edit, and manage your notes</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {draft.id ? (
                    <>
                      <button className="btn" onClick={() => setDraft({ id: null, title: "", content: "" })}>
                        Cancel edit
                      </button>
                      <button className="btn btn-primary" onClick={onUpdate}>
                        Save changes
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-primary" onClick={onCreate}>
                      Add entry
                    </button>
                  )}
                </div>
              </div>

              <div style={{ padding: 16 }}>
                {err && (
                  <div className="alert" role="alert" style={{ marginBottom: 12 }}>
                    {err}
                  </div>
                )}

                <form onSubmit={draft.id ? onUpdate : onCreate} className="row">
                  <label>
                    <div>Title</div>
                    <input
                      className="input"
                      type="text"
                      placeholder="A reflective title..."
                      value={draft.title}
                      onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    <div>Content</div>
                    <textarea
                      className="textarea"
                      placeholder="Write your thoughts here..."
                      value={draft.content}
                      onChange={(e) => setDraft((s) => ({ ...s, content: e.target.value }))}
                      required
                    />
                  </label>
                  <div>
                    <button className="btn btn-primary" type="submit">
                      {draft.id ? "Save changes" : "Create entry"}
                    </button>
                    {draft.id && (
                      <button
                        className="btn"
                        style={{ marginLeft: 8 }}
                        type="button"
                        onClick={() => setDraft({ id: null, title: "", content: "" })}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="entry-list">
                {loading && <div className="notice">Loading entries...</div>}
                {!loading && entries.length === 0 && (
                  <div className="notice">No entries yet. Create your first entry above.</div>
                )}
                {!loading &&
                  entries.map((entry) => (
                    <div className="entry-item" key={entry.id}>
                      <div>
                        <div className="entry-title">{entry.title}</div>
                        <div className="meta">
                          {fmt(entry.updated_at || entry.created_at) || "—"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn" onClick={() => onSelectEdit(entry)}>
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => onDelete(entry.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
