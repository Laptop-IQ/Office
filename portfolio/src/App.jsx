import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/context/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";

// Layout Components
import { Navbar } from "@/layout/Navbar";
import { Footer } from "./layout/Footer";

// Public Sections
import HeroSection from "./sections/Hero";

// Business Components
import SFDyesExpenseForm from "./components/SFDyesExpenseForm";
import ThermalBill from "./components/ThermalBill";
import DailySalesReport from "./components/DailySalesReport";
import OverduesDashboard from "./components/OverduesDashboard";

// Auth Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyOTP from "@/pages/VerifyOTP";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";

// Portfolio Page (Public)
function PortfolioPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
      </main>
      <Footer />
    </div>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PortfolioPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Business Routes */}
          <Route
            path="/expense-form"
            element={
              <PrivateRoute>
                <SFDyesExpenseForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/foodbills"
            element={
              <PrivateRoute>
                <ThermalBill />
              </PrivateRoute>
            }
          />
          <Route
            path="/DailySalesReport"
            element={
              <PrivateRoute>
                <DailySalesReport />
              </PrivateRoute>
            }
          />
          <Route
            path="/OverduesDashboard"
            element={
              <PrivateRoute>
                <OverduesDashboard />
              </PrivateRoute>
            }
          />

          {/* Protected User Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
