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
import FoodBill from "./components/FoodBill";
import DailySalesReport from "./components/DailySalesReport";
import ExpenseClaimBuilder from "./components/ExpenseClaimBuilder";


import OverduesDashboard from "./components/OverduesDashboard";
import QRGenerator from "./components/QRGenerator";

// Auth Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyOTP from "@/pages/VerifyOTP";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import StockManager from "./components/Stockmanager";
import PDFDocumentManager from "./components/Pdfdocumentmanager";
import Chemsalescrm from "./components/Chemsalescrm";
import Customerlistpage from "./components/Customerlistpage";
import Notepad from "./components/Notepad";
import SFDyesPurchaseOrder from "./components/Sfdyespurchaseorder";
import PriceListApp from "./components/priceList";
import CommandLibrary from "./components/CommandLibrary";
import MindMapPro from "./components/MindMapPro";
import TodoApp from "./components/TodoApp";

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
            path="/ExpenseClaimBuilder"
            element={
              <PrivateRoute>
                <ExpenseClaimBuilder />
              </PrivateRoute>
            }
          />
          <Route
            path="/foodbill"
            element={
              <PrivateRoute>
                <FoodBill />
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
            path="/qrgen"
            element={
              <PrivateRoute>
                <QRGenerator />
              </PrivateRoute>
            }
          />
          <Route
            path="/Customerlistpage"
            element={
              <PrivateRoute>
                <Customerlistpage />
              </PrivateRoute>
            }
          />
          <Route
            path="/Chemsalescrm"
            element={
              <PrivateRoute>
                <Chemsalescrm />
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
            path="/Pdfdocumentmanager"
            element={
              <PrivateRoute>
                <PDFDocumentManager />
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
            path="/notepad"
            element={
              <PrivateRoute>
                <Notepad />
              </PrivateRoute>
            }
          />
          <Route
            path="/mindmap"
            element={
              <PrivateRoute>
                <MindMapPro />
              </PrivateRoute>
            }
          />
          <Route
            path="/copypaste"
            element={
              <PrivateRoute>
                <CommandLibrary />
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
          <Route
            path="/todo"
            element={
              <PrivateRoute>
                <TodoApp />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
