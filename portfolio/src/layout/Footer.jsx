// layout/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function Footer() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
       
        <div className="mt-2 pt-2 text-center text-gray-400 text-sm">
          <p>&copy; {currentYear} MyApp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
