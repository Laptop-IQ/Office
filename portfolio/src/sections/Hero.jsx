import React from "react";
import {
  FileText,
  ShieldCheck,
  Smartphone,
  Star,
  Download,
  QrCode,
  BarChart3,
  Zap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Receipt,
  Building2,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DailySalesReport from "../components/DailySalesReport";

export default function HeroSection() {
  const navigate = useNavigate();
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 left-0 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b30_1px,transparent_1px),linear-gradient(to_bottom,#1e293b30_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

      <div className="relative container mx-auto px-6 lg:px-12">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center py-16 lg:py-20 min-h-screen">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm px-5 py-2 shadow-lg animate-pulse">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                India's Smartest Bill Generator
              </span>
              <Zap className="h-3 w-3 text-blue-400" />
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              <span className="text-white">Generate</span>
              <span className="block bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-gradient">
                Professional Bills
              </span>
              <span className="text-white">In Seconds</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              Create restaurant bills, hotel invoices, GST invoices, mobile shop
              receipts and custom business invoices with modern templates and
              instant PDF export.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/DailySalesReport")}
                className="group rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 text-white font-semibold shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105 flex items-center gap-2"
              >
                DVR
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-4 font-semibold text-white hover:bg-white/10 transition-all hover:scale-105">
                View Templates
              </button>
            </div>
          </div>

          {/* Right Side - Interactive Invoice Card */}
          <div className="relative flex justify-center">
            {/* Main Invoice Card */}
            <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 shadow-2xl animate-float">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-2xl bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
                    BillPro AI
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Professional Invoice
                  </p>
                </div>
                <span className="rounded-full bg-gradient-to-r from-green-500/20 to-green-400/20 px-4 py-1.5 text-xs font-semibold text-green-400 border border-green-500/30">
                  ✓ PAID
                </span>
              </div>

              {/* Invoice Details */}
              <div className="mt-6 space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice #</span>
                  <span className="font-mono">INV-2026-1045</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer</span>
                  <span>Rahul Sharma</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date</span>
                  <span>15 June 2026</span>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-6 border-t border-white/10 pt-4 space-y-3">
                {[
                  { item: "Burger x2", price: "₹300" },
                  { item: "Cold Drink x2", price: "₹120" },
                  { item: "Fries x1", price: "₹90" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-slate-300"
                  >
                    <span>{item.item}</span>
                    <span>{item.price}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span>₹510</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>GST (18%)</span>
                  <span>₹91.80</span>
                </div>
                <div className="flex justify-between pt-2 text-xl font-bold">
                  <span className="bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
                    Total
                  </span>
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    ₹601.80
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
