const API = import.meta.env.VITE_API_URL;

if (!API) {
  // Fails loudly at dev-time instead of silently sending requests to
  // "undefined/notes" — which is the #1 cause of "nothing happens" bugs.
  console.error(
    "[api] VITE_API_URL is not set. Add it to your .env file, e.g.\n" +
      "VITE_API_URL=http://localhost:4000/api\n" +
      "Then restart `npm run dev` (Vite only reads .env on startup).",
  );
}

const getToken = () => localStorage.getItem("token");
const setToken = (token) => localStorage.setItem("token", token);
const clearToken = () => localStorage.removeItem("token");

export const auth = { getToken, setToken, clearToken };

const request = async (path, options = {}) => {
  const token = getToken();

  let res;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (err) {
    // Network failure: backend down, wrong VITE_API_URL, CORS block, etc.
    console.error("[api] fetch failed:", `${API}${path}`, err);
    throw new Error(
      "Could not reach the server. Check that the backend is running and VITE_API_URL is correct.",
    );
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (res.status === 401) {
    clearToken();
    throw new Error(data?.message || "Session expired. Please log in again.");
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
};

// Backend controller already maps _id -> id, this just guards
// against either shape so the frontend never breaks.
const normalize = (note) => ({ ...note, id: note.id || note._id });

export const notesApi = {
  // GET /api/notes  (optional: { search, tag, filter }) -> normalized array
  getAll: async (params = {}) => {
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      ),
    );
    const qs = new URLSearchParams(cleaned).toString();
    const data = await request(`/notes${qs ? `?${qs}` : ""}`);
    return (data.notes || []).map(normalize);
  },

  // GET /api/notes/:id -> normalized note
  getOne: async (id) => {
    const data = await request(`/notes/${id}`);
    return normalize(data.note);
  },

  // POST /api/notes -> normalized note
  create: async (note) => {
    const data = await request("/notes", {
      method: "POST",
      body: JSON.stringify(note),
    });
    return normalize(data.note);
  },

  // PUT /api/notes/:id — used for autosave (title, content, tags, color...)
  update: async (id, patch) => {
    const data = await request(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return normalize(data.note);
  },

  // DELETE /api/notes/:id
  remove: (id) => request(`/notes/${id}`, { method: "DELETE" }),

  // PATCH toggles -> each returns normalized note
  togglePin: async (id) => {
    const data = await request(`/notes/${id}/pin`, { method: "PATCH" });
    return normalize(data.note);
  },
  toggleFavorite: async (id) => {
    const data = await request(`/notes/${id}/favorite`, { method: "PATCH" });
    return normalize(data.note);
  },
  toggleArchive: async (id) => {
    const data = await request(`/notes/${id}/archive`, { method: "PATCH" });
    return normalize(data.note);
  },
};
