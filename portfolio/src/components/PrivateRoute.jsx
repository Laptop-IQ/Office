// components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLoader from "./AppLoader";

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();

  // A stored token is enough to open the page right away. The profile is
  // verified in the background (AuthContext) and a 401/403 logs the user out,
  // so pages no longer wait for the /user/me round trip before showing.
  if (token) return children;
  if (loading) return <AppLoader label="Checking session" />;
  return <Navigate to="/login" />;
};

export default PrivateRoute;
