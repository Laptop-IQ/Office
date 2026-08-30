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


// Auth Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyOTP from "@/pages/VerifyOTP";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

import DailySalesReport from "./components/DailySalesReport";
import OverduesDashboard from "./components/OverduesDashboard";
import StockManager from "./components/Stockmanager";
import SFDyesPurchaseOrder from "./components/Sfdyespurchaseorder";
import PriceListApp from "./components/priceList";


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
          <Route
            path="/Stockmanager"
            element={
              <PrivateRoute>
                <StockManager />
              </PrivateRoute>
            }
          />
        
          <Route
            path="/pricelist"
            element={
              <PrivateRoute>
                <PriceListApp />
              </PrivateRoute>
            }
          />
        
          <Route
            path="/purchase"
            element={
              <PrivateRoute>
                <SFDyesPurchaseOrder />
              </PrivateRoute>
            }
          />
         
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
