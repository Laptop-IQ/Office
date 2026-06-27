const API = import.meta.env.VITE_API_URL;

if (!API) {
  console.error(
    "[api] VITE_API_URL is not set. Add it to your .env file, e.g.\n" +
      "VITE_API_URL=http://localhost:4000/api\n" +
      "Then restart `npm run dev` (Vite only reads .env on startup).",
  );
}

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const setToken = (token, remember = false) => {
  if (remember) {
    localStorage.setItem("token", token);
  } else {
    sessionStorage.setItem("token", token);
  }
};

const clearToken = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
};

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

const normalize = (note) => ({ ...note, id: note.id || note._id });

export const notesApi = {
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

  getOne: async (id) => {
    const data = await request(`/notes/${id}`);
    return normalize(data.note);
  },

  create: async (note) => {
    const data = await request("/notes", {
      method: "POST",
      body: JSON.stringify(note),
    });
    return normalize(data.note);
  },

  update: async (id, patch) => {
    const data = await request(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return normalize(data.note);
  },

  remove: (id) => request(`/notes/${id}`, { method: "DELETE" }),

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
