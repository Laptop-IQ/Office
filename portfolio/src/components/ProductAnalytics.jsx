import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Package,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Sample data. This page runs on local sample data so it works standalone.
// Swap `products` for a real API response and the rest keeps working as-is.
// ---------------------------------------------------------------------------

const CATEGORY_COLORS = {
  Electronics: "rgb(32,178,166)",
  Apparel: "#38BDF8",
  "Home & Kitchen": "#FBBF24",
  Accessories: "#A78BFA",
};

const products = [
  { id: 1, name: "Wireless Noise-Cancelling Headphones", category: "Electronics", price: 129, unitsSold: 842, growth: 18.4, stock: 156, stockCapacity: 300 },
  { id: 2, name: "Smart Fitness Watch", category: "Electronics", price: 199, unitsSold: 634, growth: 24.1, stock: 42, stockCapacity: 250 },
  { id: 3, name: "Organic Cotton T-Shirt", category: "Apparel", price: 28, unitsSold: 1204, growth: 6.2, stock: 680, stockCapacity: 800 },
  { id: 4, name: "Minimalist Leather Wallet", category: "Accessories", price: 65, unitsSold: 512, growth: -3.8, stock: 210, stockCapacity: 400 },
  { id: 5, name: "Ceramic Pour-Over Coffee Set", category: "Home & Kitchen", price: 48, unitsSold: 389, growth: 11.5, stock: 95, stockCapacity: 200 },
  { id: 6, name: "Ergonomic Laptop Stand", category: "Electronics", price: 54, unitsSold: 721, growth: 32.7, stock: 18, stockCapacity: 300 },
  { id: 7, name: "Merino Wool Beanie", category: "Apparel", price: 32, unitsSold: 445, growth: -1.2, stock: 340, stockCapacity: 500 },
  { id: 8, name: "Stainless Steel Water Bottle", category: "Home & Kitchen", price: 22, unitsSold: 968, growth: 9.8, stock: 512, stockCapacity: 600 },
  { id: 9, name: "Bluetooth Portable Speaker", category: "Electronics", price: 89, unitsSold: 556, growth: 14.6, stock: 88, stockCapacity: 250 },
  { id: 10, name: "Canvas Weekender Bag", category: "Accessories", price: 75, unitsSold: 298, growth: 5.4, stock: 145, stockCapacity: 200 },
].map((p) => ({ ...p, revenue: p.price * p.unitsSold }));

const CATEGORIES = ["All", ...new Set(products.map((p) => p.category))];

const RANGES = [
  { key: "7d", label: "7D", points: 7 },
  { key: "30d", label: "30D", points: 30 },
  { key: "90d", label: "90D", points: 13 },
  { key: "1y", label: "1Y", points: 12 },
];

// Small seeded PRNG so the chart looks the same across re-renders instead
// of jumping around every time React re-evaluates the module.
const seededRandom = (seed) => {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

const buildSeries = (points, seed) => {
  const rand = seededRandom(seed);
  let value = 12000;
  const data = [];
  for (let i = 0; i < points; i++) {
    const trend = 1.018;
    const noise = (rand() - 0.5) * 1600;
    value = Math.max(value * trend + noise, 4000);
    data.push(Math.round(value));
  }
  return data;
};

const labelForRange = (rangeKey, index, points) => {
  const now = new Date(2026, 7, 20); // Aug 20, 2026
  const d = new Date(now);
  if (rangeKey === "7d") {
    d.setDate(d.getDate() - (points - 1 - index));
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (rangeKey === "30d") {
    d.setDate(d.getDate() - (points - 1 - index));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (rangeKey === "90d") {
    d.setDate(d.getDate() - (points - 1 - index) * 7);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  d.setMonth(d.getMonth() - (points - 1 - index));
  return d.toLocaleDateString("en-US", { month: "short" });
};

const revenueSeriesByRange = RANGES.reduce((acc, r, i) => {
  const values = buildSeries(r.points, 42 + i * 17);
  acc[r.key] = values.map((v, idx) => ({
    label: labelForRange(r.key, idx, r.points),
    revenue: v,
  }));
  return acc;
}, {});

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 border border-primary/20 shadow-xl">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-semibold text-primary">
        ${payload[0].value.toLocaleString()}
      </div>
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="glass rounded-xl px-4 py-3 border border-primary/20 shadow-xl">
      <div className="text-xs text-muted-foreground mb-1">{name}</div>
      <div className="text-sm font-semibold text-primary">
        ${value.toLocaleString()}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, trend, trendText, sparkline }) => {
  const isPositive = trend === undefined ? true : trend >= 0;

  return (
    <motion.div
      variants={fadeUp}
      className="glass rounded-2xl p-6 border border-primary/10 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>

        <div
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {trendText ?? `${Math.abs(trend).toFixed(1)}%`}
        </div>
      </div>

      <div className="text-2xl md:text-3xl font-bold mt-4 tracking-tight">
        {value}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>

      <div className="h-10 mt-4 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkline}>
            <Area
              type="monotone"
              dataKey="v"
              stroke={isPositive ? "rgb(32,178,166)" : "#f87171"}
              fill={isPositive ? "rgb(32,178,166)" : "#f87171"}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

const SortHeader = ({ label, sortKey, sortConfig, onSort, align = "left", className = "" }) => {
  const isActive = sortConfig.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-primary transition-colors ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      <span
        className={`inline-flex items-center gap-1 ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        {label}
        {isActive ? (
          sortConfig.direction === "asc" ? (
            <ArrowUp className="w-3 h-3 text-primary" />
          ) : (
            <ArrowDown className="w-3 h-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </span>
    </th>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const ProductAnalytics = () => {
  const shouldReduceMotion = useReducedMotion();
  const [timeRange, setTimeRange] = useState("30d");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: "revenue", direction: "desc" });

  const chartData = revenueSeriesByRange[timeRange];
  const xAxisInterval = chartData.length > 15 ? Math.ceil(chartData.length / 6) : 0;

  const totals = useMemo(() => {
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const totalUnits = products.reduce((sum, p) => sum + p.unitsSold, 0);
    const avgOrderValue = totalRevenue / totalUnits;
    const avgGrowth =
      products.reduce((sum, p) => sum + p.growth, 0) / products.length;
    return { totalRevenue, totalUnits, avgOrderValue, avgGrowth };
  }, []);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + p.revenue;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  const sparklines = useMemo(() => {
    const tail = chartData.slice(-8);
    return {
      revenue: tail.map((d, i) => ({ i, v: d.revenue })),
      units: tail.map((d, i) => ({ i, v: Math.round(d.revenue / 18) })),
      aov: tail.map((d, i, arr) => {
        const avg = arr.reduce((s, x) => s + x.revenue, 0) / arr.length;
        return { i, v: Math.round((d.revenue * 0.3 + avg * 0.7) / 100) };
      }),
      active: tail.map((d, i) => ({ i, v: 8 + Math.round((d.revenue % 500) / 150) })),
    };
  }, [chartData]);

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    const { key, direction } = sortConfig;
    const dir = direction === "asc" ? 1 : -1;

    return [...list].sort((a, b) => {
      if (typeof a[key] === "string") return a[key].localeCompare(b[key]) * dir;
      return (a[key] - b[key]) * dir;
    });
  }, [search, categoryFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" },
    );
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("All");
  };

  const handleExport = () => {
    const headers = ["Product", "Category", "Units Sold", "Revenue", "Growth %", "Stock"];
    const rows = filteredProducts.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.unitsSold,
      p.revenue.toFixed(2),
      p.growth,
      p.stock,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `product-analytics-${timeRange}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen py-16 md:py-24 relative overflow-hidden">
      {/* Background grid texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.04] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute top-0 right-[10%] w-[28rem] h-[28rem] bg-primary/10 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px 0px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-primary" />
              <span className="text-primary text-sm font-medium uppercase tracking-[0.2em]">
                Dashboard
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-secondary-foreground">
              Product{" "}
              <span className="font-serif italic font-normal text-white">
                Analytics.
              </span>
            </h1>
            <p className="text-muted-foreground mt-3 max-w-lg">
              Revenue, inventory, and performance across the catalog.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-border">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setTimeRange(r.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === r.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/20 hover:border-primary/40 hover:bg-primary/10 text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </motion.div>

        {/* KPI cards */}
        <motion.div
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-80px 0px" }}
          variants={staggerContainer}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6"
        >
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`$${totals.totalRevenue.toLocaleString()}`}
            trend={totals.avgGrowth}
            sparkline={sparklines.revenue}
          />
          <StatCard
            icon={ShoppingCart}
            label="Units Sold"
            value={totals.totalUnits.toLocaleString()}
            trend={8.2}
            sparkline={sparklines.units}
          />
          <StatCard
            icon={Receipt}
            label="Avg. Order Value"
            value={`$${totals.avgOrderValue.toFixed(2)}`}
            trend={3.1}
            sparkline={sparklines.aov}
          />
          <StatCard
            icon={Package}
            label="Active Products"
            value={products.length}
            trend={1}
            trendText="+2 new"
            sparkline={sparklines.active}
          />
        </motion.div>

        {/* Charts */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px 0px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid lg:grid-cols-3 gap-6 mb-6"
        >
          <div className="lg:col-span-2 glass rounded-2xl p-6 md:p-8 border border-primary/10">
            <h3 className="text-lg font-semibold mb-6">Revenue trend</h3>
            <div className="h-64 text-muted-foreground -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(32,178,166)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="rgb(32,178,166)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="currentColor"
                    tick={{ fill: "currentColor", fillOpacity: 0.6, fontSize: 12 }}
                    interval={xAxisInterval}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="currentColor"
                    tick={{ fill: "currentColor", fillOpacity: 0.6, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="rgb(32,178,166)"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 md:p-8 border border-primary/10">
            <h3 className="text-lg font-semibold mb-6">By category</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {categoryBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 mt-4">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.name] || "#94a3b8" }}
                  />
                  <span className="text-sm flex-1 truncate">{cat.name}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {((cat.value / totals.totalRevenue) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Products table */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px 0px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-2xl p-6 md:p-8 border border-primary/10"
        >
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2.5 bg-surface rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    categoryFilter === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">
                No products match{search ? ` “${search}”` : ""}
                {categoryFilter !== "All" ? ` in ${categoryFilter}` : ""}.
              </p>
              <button
                onClick={clearFilters}
                className="text-primary text-sm font-medium mt-3 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr>
                    <SortHeader label="Product" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                    <SortHeader
                      label="Category"
                      sortKey="category"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      className="hidden md:table-cell"
                    />
                    <SortHeader label="Units" sortKey="unitsSold" sortConfig={sortConfig} onSort={handleSort} align="right" />
                    <SortHeader label="Revenue" sortKey="revenue" sortConfig={sortConfig} onSort={handleSort} align="right" />
                    <SortHeader label="Growth" sortKey="growth" sortConfig={sortConfig} onSort={handleSort} align="right" />
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const stockPct = (p.stock / p.stockCapacity) * 100;
                    const stockColor =
                      stockPct < 15 ? "bg-red-500" : stockPct < 40 ? "bg-amber-500" : "bg-green-500";
                    const isPositive = p.growth >= 0;

                    return (
                      <tr key={p.id} className="border-t border-border hover:bg-surface/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden">{p.category}</div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground hidden md:table-cell">{p.category}</td>
                        <td className="px-4 py-4 text-right tabular-nums">{p.unitsSold.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right tabular-nums font-medium">
                          ${p.revenue.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                              isPositive
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {Math.abs(p.growth).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-surface overflow-hidden">
                              <div
                                className={`h-full rounded-full ${stockColor}`}
                                style={{ width: `${Math.min(stockPct, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums">{p.stock}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
};
