import axios from "axios";

// ────────────────────────────────────────────
// Base axios instance
// ────────────────────────────────────────────
const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

// ===================================================
// Customer List APIs
// Base Route => /api/customerlist
// ===================================================

// Get Customers
export const fetchCustomers = (params = {}) =>
  api.get("/customerlist", { params }).then((res) => res.data);

// Customer Dashboard Stats
export const fetchCustomerStats = () =>
  api.get("/customerlist/stats").then((res) => res.data);

// Get Single Customer
export const fetchCustomerById = (id) =>
  api.get(`/customerlist/${id}`).then((res) => res.data);

// Create Customer
export const createCustomer = (payload) =>
  api.post("/customerlist", payload).then((res) => res.data);

// Update Customer
export const updateCustomer = (id, payload) =>
  api.put(`/customerlist/${id}`, payload).then((res) => res.data);

// Delete Customer
export const deleteCustomer = (id) =>
  api.delete(`/customerlist/${id}`).then((res) => res.data);

// Bulk Delete Customers
export const bulkDeleteCustomers = (ids) =>
  api.post("/customerlist/bulk-delete", { ids }).then((res) => res.data);

// Bulk Assign Sales Person
export const bulkAssignSalesPerson = (ids, salesPerson) =>
  api
    .post("/customerlist/bulk-assign", {
      ids,
      salesPerson,
    })
    .then((res) => res.data);

// Add Timeline Entry
export const addTimelineEntry = (id, entry) =>
  api.post(`/customerlist/${id}/timeline`, entry).then((res) => res.data);

export default api;
