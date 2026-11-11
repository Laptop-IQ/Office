import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { loadXLSX } from "@/lib/xlsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import PrivateRoute from "@/components/PrivateRoute";
import AppLoader from "@/components/AppLoader";

// Layout Components
import { Navbar } from "@/layout/Navbar";
import { Footer } from "./layout/Footer";

// Public Sections
import HeroSection from "./sections/Hero";

// Every page below is code-split: it is only downloaded when its route is
// opened, so the home page no longer ships the whole application.
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const VerifyOTP = lazy(() => import("@/pages/VerifyOTP"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));

// Pages that export Excel files also need the (separately chunked) Excel
// engine. It starts downloading in the background as soon as the page code is
// requested – the page itself renders without waiting for it, and the home
// page never downloads it.
const withExcel = (loader) => () => {
  loadXLSX().catch(() => {});
  return loader();
};
const loaders = {
  dsr: withExcel(() => import("./components/DailySalesReport")),
  overdues: withExcel(() => import("./components/OverduesDashboard")),
  purchase: withExcel(() => import("./components/Sfdyespurchaseorder")),
  priceList: withExcel(() => import("./components/priceList")),
  ecofast: () => import("./components/EcofastEntry"),
  stock: () => import("./components/stock/StockModule"),
};
const DailySalesReport = lazy(loaders.dsr);
const OverduesDashboard = lazy(loaders.overdues);
const SFDyesPurchaseOrder = lazy(loaders.purchase);
const PriceListApp = lazy(loaders.priceList);
const EcofastEntry = lazy(loaders.ecofast);
const StockLayout = lazy(() => loaders.stock().then((m) => ({ default: m.StockLayout })));
const StockApp = lazy(() => loaders.stock().then((m) => ({ default: m.StockApp })));
const DispatchApp = lazy(() => loaders.stock().then((m) => ({ default: m.DispatchApp })));

function RouteFallback({ page = false }) {
  return <AppLoader variant={page ? "page" : "full"} label="Loading" />;
}

// Shared layout for every logged-in page: one navbar on top, the page below.
// Suspense sits inside, so the navbar stays put while a page chunk loads.
function AppLayout() {
  useEffect(() => {
    document.documentElement.classList.add("has-appnav");
    return () => document.documentElement.classList.remove("has-appnav");
  }, []);
  return (
    <>
      <Navbar />
      <div className="app-shell-body">
        <Suspense fallback={<RouteFallback page />}>
          <Outlet />
        </Suspense>
      </div>
    </>
  );
}

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
// When the user is logged in, warm the cache for the most used pages once the
// browser is idle, so navigating to them feels instant.
function usePrefetch() {
  useEffect(() => {
    if (!localStorage.getItem("token")) return undefined;
    const run = () => {
      // page code only – the Excel engine is NOT prefetched (it is large and
      // only needed when a page is actually opened).
      [() => import("./components/stock/StockModule"), () => import("./components/DailySalesReport")].forEach((l) => l().catch(() => {}));
    };
    const id = "requestIdleCallback" in window ? window.requestIdleCallback(run, { timeout: 4000 }) : setTimeout(run, 2500);
    return () => ("cancelIdleCallback" in window ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []);
}

function Prefetcher() {
  usePrefetch();
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ThemeToggle />
        <Prefetcher />
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

          <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PortfolioPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Private pages – all share the navbar layout */}
            <Route
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            >
              <Route path="/DailySalesReport/*" element={<DailySalesReport />} />
              <Route path="/OverduesDashboard/*" element={<OverduesDashboard />} />

              {/* Stock Manager + Dispatch share one data provider */}
              <Route element={<StockLayout />}>
                <Route path="/Stockmanager/*" element={<StockApp />} />
                <Route path="/Dispatch/*" element={<DispatchApp />} />
              </Route>

              <Route path="/pricelist" element={<PriceListApp />} />
              <Route path="/Ecofast" element={<EcofastEntry />} />
              <Route path="/purchase" element={<SFDyesPurchaseOrder />} />
            </Route>
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
