import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  FileText,
  ReceiptText,
  TrendingUp,
  Users2,
  Boxes,
  FolderOpen,
  Wallet,
  CircleDot,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mirrors the Navbar's businessCategories structure so the hero acts as a
// launcher for the same modules, grouped the same way.
const officeModules = [
  {
    label: "Finance",
    accent: "from-amber-400 to-orange-400",
    items: [
      { name: "Expense Form", path: "/expense-form", icon: FileText },
      { name: "Overdues", path: "/OverduesDashboard", icon: Wallet },
    ],
  },
  {
    label: "Sales & CRM",
    accent: "from-blue-400 to-cyan-400",
    items: [
      { name: "Sales Report", path: "/DailySalesReport", icon: TrendingUp },
      { name: "CRM Activity", path: "/Chemsalescrm", icon: Users2 },
    ],
  },
  {
    label: "Management",
    accent: "from-violet-400 to-fuchsia-400",
    items: [
      { name: "Customer Lists", path: "/Customerlistpage", icon: Users2 },
      { name: "Stock List", path: "/Stockmanager", icon: Boxes },
      { name: "PDF Documents", path: "/Pdfdocumentmanager", icon: FolderOpen },
    ],
  },
];

// Live-feeling status strip — the "signature element". Purely presentational,
// cycles through a few office-pulse style lines.
const pulseLines = [
  { dot: "bg-emerald-400", text: "Sales Report updated 6 min ago" },
  { dot: "bg-amber-400", text: "3 invoices marked overdue" },
  { dot: "bg-cyan-400", text: "Stock list: 12 items running low" },
  { dot: "bg-violet-400", text: "2 new CRM activities logged" },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPulseIndex((i) => (i + 1) % pulseLines.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#0b1120] min-h-screen">
      {/* Background atmosphere */}
      <div className="absolute top-[-10%] left-[-5%] h-[560px] w-[560px] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="absolute bottom-[-10%] right-[-5%] h-[480px] w-[480px] rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b25_1px,transparent_1px),linear-gradient(to_bottom,#1e293b25_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent" />

      <div className="relative container mx-auto px-6 lg:px-12 pt-28 pb-16">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm px-5 py-2 mb-8">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            One login. Every part of the office.
          </span>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-16 items-start">
          {/* Left: headline + live pulse + primary CTA */}
          <div className="space-y-10">
            <div>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                <span className="text-white">My</span>{" "}
                <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Office
                </span>
                <span className="block text-white">Apps</span>
              </h1>
              <p className="mt-6 text-lg text-slate-400 max-w-lg leading-relaxed">
                Billing, sales, CRM, stock and customer records — run the whole
                day's work from a single dashboard, instead of switching between
                tools.
              </p>
            </div>

            {/* Live office pulse strip — signature element */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-5 py-4 max-w-md">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                <CircleDot className="h-3.5 w-3.5 text-emerald-400" />
                Live from your office
              </div>
              <div className="h-5 overflow-hidden relative">
                {pulseLines.map((line, idx) => (
                  <div
                    key={line.text}
                    className={`absolute inset-0 flex items-center gap-2 text-sm text-slate-300 transition-all duration-500 ${
                      idx === pulseIndex
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-2"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${line.dot}`} />
                    {line.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/DailySalesReport")}
                className="group rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 text-white font-semibold shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105 flex items-center gap-2"
              >
                Open Sales Report
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/Stockmanager")}
                className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm px-8 py-4 font-semibold text-white hover:bg-white/10 transition-all hover:scale-105"
              >
                View Stock List
              </button>
            </div>
          </div>

          {/* Right: module launcher grid, mirroring Navbar categories */}
          <div className="space-y-5">
            {officeModules.map((category) => (
              <div
                key={category.label}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`h-1.5 w-6 rounded-full bg-gradient-to-r ${category.accent}`}
                  />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {category.label}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {category.items.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.path)}
                      className="group flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.07] hover:border-white/15 transition-all"
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                        {item.name}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
