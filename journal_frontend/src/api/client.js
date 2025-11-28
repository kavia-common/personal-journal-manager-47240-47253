//
// API client for Journal Frontend
// - Reads backend base URL from env (REACT_APP_API_BASE or VITE_API_BASE), defaulting to http://localhost:3001
// - Exposes public interfaces for auth and journal CRUD
//

/**
 * Resolve API base URL from environment variables or default.
 * CRA uses REACT_APP_* vars during build.
 * We also check window.ENV for future extensibility and VITE_API_BASE as a fallback hint.
 */
const resolveBaseUrl = () => {
  // Attempt to read from window.ENV injected at runtime (optional pattern)
  const runtimeEnv = typeof window !== "undefined" && window.ENV ? window.ENV : {};
  const envBase =
    process.env.REACT_APP_API_BASE ||
    runtimeEnv.REACT_APP_API_BASE ||
    process.env.VITE_API_BASE ||
    runtimeEnv.VITE_API_BASE;

  // Default if nothing set
  return envBase && envBase.trim() !== "" ? envBase : "http://localhost:3001";
};

const API_BASE = resolveBaseUrl();

/**
 * Get stored auth token (from localStorage)
 */
const getToken = () => {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
};

/**
 * Save auth token
 */
const setToken = (token) => {
  try {
    if (token) localStorage.setItem("auth_token", token);
    else localStorage.removeItem("auth_token");
  } catch {
    // ignore storage errors
  }
};

/**
 * Build headers with JSON and optional Authorization
 */
const buildHeaders = (authorized = false) => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (authorized) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Handle HTTP response with JSON parsing and error propagation
 */
const handleResponse = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    const message = isJson && body && body.detail ? body.detail : res.statusText || "Request failed";
    const err = new Error(message);
    err.status = res.status;
    err.data = body;
    throw err;
  }
  return body;
};

// PUBLIC_INTERFACE
export const api = {
  /** Authentication APIs */

  // PUBLIC_INTERFACE
  async login({ email, password }) {
    /** Login user and store token */
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: buildHeaders(false),
      body: JSON.stringify({ email, password }),
      credentials: "include",
      mode: "cors",
    });
    const data = await handleResponse(res);
    if (data && data.access_token) {
      setToken(data.access_token);
    }
    return data;
  },

  // PUBLIC_INTERFACE
  async register({ email, password, name }) {
    /** Register a new user */
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: buildHeaders(false),
      body: JSON.stringify({ email, password, name }),
      credentials: "include",
      mode: "cors",
    });
    return handleResponse(res);
  },

  // PUBLIC_INTERFACE
  async me() {
    /** Get current user profile */
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: buildHeaders(true),
      credentials: "include",
      mode: "cors",
    });
    return handleResponse(res);
  },

  // PUBLIC_INTERFACE
  logout() {
    /** Clear local token */
    setToken(null);
    return Promise.resolve();
  },

  /** Journal CRUD */

  // PUBLIC_INTERFACE
  async listEntries() {
    /** List journal entries */
    const res = await fetch(`${API_BASE}/entries`, {
      method: "GET",
      headers: buildHeaders(true),
      credentials: "include",
      mode: "cors",
    });
    return handleResponse(res);
  },

  // PUBLIC_INTERFACE
  async createEntry({ title, content }) {
    /** Create a journal entry */
    const res = await fetch(`${API_BASE}/entries`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify({ title, content }),
      credentials: "include",
      mode: "cors",
    });
    return handleResponse(res);
  },

  // PUBLIC_INTERFACE
  async updateEntry(id, { title, content }) {
    /** Update a journal entry by id */
    const res = await fetch(`${API_BASE}/entries/${id}`, {
      method: "PUT",
      headers: buildHeaders(true),
      body: JSON.stringify({ title, content }),
      credentials: "include",
      mode: "cors",
    });
    return handleResponse(res);
  },

  // PUBLIC_INTERFACE
  async deleteEntry(id) {
    /** Delete a journal entry by id */
    const res = await fetch(`${API_BASE}/entries/${id}`, {
      method: "DELETE",
      headers: buildHeaders(true),
      credentials: "include",
      mode: "cors",
    });
    return handleResponse(res);
  },

  // PUBLIC_INTERFACE
  getApiBase() {
    /** Returns the resolved API base URL */
    return API_BASE;
  },
};

export default api;
