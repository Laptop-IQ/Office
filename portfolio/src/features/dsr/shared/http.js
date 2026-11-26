// features/dsr/shared/http.js
// Authenticated JSON fetch for the DSR API. Throws Error(message) on a non-2xx response.
export const API = import.meta.env.VITE_API_BASE_URL;
export const getToken = () => localStorage.getItem("token") || "";
export const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};
