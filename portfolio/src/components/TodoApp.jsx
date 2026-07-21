import React, {
  useState, useMemo, useEffect, useRef, useContext, createContext,
} from 'react';
import {
  Search, Bell, Moon, Sun, Plus, Star, Trash2, Pencil, Copy, Archive,
  ArchiveRestore, MoreVertical, CheckCircle2, Circle, Calendar, Tag,
  ArrowUpDown, LayoutDashboard, BarChart3, Settings, Briefcase, User,
  BookOpen, ShoppingCart, Dumbbell, Plane, DollarSign, Heart, Sparkles,
  X, ChevronDown, AlertTriangle, Inbox, Flame, ListChecks, PartyPopper,
  Download, Upload, RotateCcw, Minus,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid,
} from 'recharts';

/* ============================== CONSTANTS ============================== */

const CATEGORIES = [
  { id: 'work', label: 'Work', icon: Briefcase, color: 'indigo' },
  { id: 'personal', label: 'Personal', icon: User, color: 'violet' },
  { id: 'study', label: 'Study', icon: BookOpen, color: 'blue' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingCart, color: 'pink' },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'emerald' },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'cyan' },
  { id: 'finance', label: 'Finance', icon: DollarSign, color: 'amber' },
  { id: 'health', label: 'Health', icon: Heart, color: 'rose' },
  { id: 'custom', label: 'Custom', icon: Sparkles, color: 'slate' },
];
const getCategory = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

const PRIORITIES = [
  { id: 'high', label: 'High', color: 'red' },
  { id: 'medium', label: 'Medium', color: 'amber' },
  { id: 'low', label: 'Low', color: 'emerald' },
];
const getPriority = (id) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[1];

const COLOR_SWATCHES = ['indigo', 'violet', 'rose', 'amber', 'emerald', 'cyan'];
const ACCENT_OPTIONS = ['indigo', 'violet', 'emerald', 'rose'];
const ACCENT_PAIR = { indigo: 'violet', violet: 'fuchsia', emerald: 'teal', rose: 'pink' };
const HEX = {
  indigo: '#6366f1', violet: '#8b5cf6', blue: '#3b82f6', pink: '#ec4899',
  emerald: '#10b981', cyan: '#06b6d4', amber: '#f59e0b', rose: '#f43f5e',
  slate: '#64748b', red: '#ef4444',
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'archived', label: 'Archived' },
];

const SORTS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'priority', label: 'Priority' },
  { id: 'dueDate', label: 'Due date' },
  { id: 'az', label: 'Alphabetical' },
];

/* ============================== HELPERS ============================== */

let idCounter = 1;
const uid = () => `task-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const daysFromNowDate = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

function formatDue(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const diff = Math.round((d - t) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
const isOverdue = (t) => !!t.dueDate && !t.completed && t.dueDate < todayISO();

function badgeClasses(color, dark) {
  return dark
    ? `bg-${color}-500/10 text-${color}-300 border border-${color}-500/30`
    : `bg-${color}-50 text-${color}-700 border border-${color}-200`;
}
function softIconClasses(color, dark) {
  return dark ? `bg-${color}-500/15 text-${color}-300` : `bg-${color}-100 text-${color}-600`;
}

/* ============================== SEED DATA ============================== */

function makeSeedTasks() {
  return [
    { id: uid(), title: 'Finalize Q3 investor deck', description: 'Polish slides 8–12 and rehearse the narrative for the Thursday review.', category: 'work', priority: 'high', dueDate: daysFromNowDate(0), dueTime: '14:00', tags: ['deck', 'investors'], color: 'indigo', completed: false, favorite: true, archived: false, createdAt: daysAgoISO(3), completedAt: null },
    { id: uid(), title: 'Morning 5k run', description: 'Easy pace along the river loop before the heat picks up.', category: 'fitness', priority: 'medium', dueDate: daysFromNowDate(0), dueTime: '07:00', tags: ['cardio'], color: null, completed: true, favorite: false, archived: false, createdAt: daysAgoISO(1), completedAt: daysAgoISO(0) },
    { id: uid(), title: 'Pay electricity bill', description: 'Due before late fees kick in this billing cycle.', category: 'finance', priority: 'high', dueDate: daysFromNowDate(-2), dueTime: '', tags: ['bills'], color: null, completed: false, favorite: false, archived: false, createdAt: daysAgoISO(5), completedAt: null },
    { id: uid(), title: 'Read two chapters of Atomic Habits', description: 'Continue the habit-stacking section.', category: 'study', priority: 'low', dueDate: daysFromNowDate(3), dueTime: '', tags: ['reading', 'growth'], color: null, completed: false, favorite: false, archived: false, createdAt: daysAgoISO(2), completedAt: null },
    { id: uid(), title: 'Book flights to Lisbon', description: 'Compare fares for the September offsite week.', category: 'travel', priority: 'medium', dueDate: daysFromNowDate(6), dueTime: '', tags: ['offsite'], color: 'cyan', completed: false, favorite: true, archived: false, createdAt: daysAgoISO(4), completedAt: null },
    { id: uid(), title: 'Refill grocery essentials', description: 'Eggs, oats, greens, coffee.', category: 'shopping', priority: 'low', dueDate: daysFromNowDate(1), dueTime: '', tags: [], color: null, completed: false, favorite: false, archived: false, createdAt: daysAgoISO(0), completedAt: null },
    { id: uid(), title: 'Annual dental checkup', description: 'Confirm the appointment time with the clinic.', category: 'health', priority: 'medium', dueDate: daysFromNowDate(-1), dueTime: '', tags: [], color: null, completed: false, favorite: false, archived: false, createdAt: daysAgoISO(6), completedAt: null },
    { id: uid(), title: 'Archive old onboarding notes', description: 'No longer relevant after the new wiki launch.', category: 'work', priority: 'low', dueDate: '', dueTime: '', tags: ['cleanup'], color: null, completed: true, favorite: false, archived: true, createdAt: daysAgoISO(10), completedAt: daysAgoISO(9) },
  ];
}

/* ============================== CONTEXT ============================== */

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

/* ============================== CUSTOM HOOKS ============================== */

function useCountUp(value, duration = 600) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    let raf; let t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else prevRef.current = end;
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);
  return display;
}

/* ============================== SMALL UI BITS ============================== */

function ProgressRing({ pct, dark, accent }) {
  const r = 30; const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <svg viewBox="0 0 72 72" className="w-16 h-16 -rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6" className={dark ? 'stroke-white/10' : 'stroke-slate-200'} />
      <circle
        cx="36" cy="36" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
        stroke={HEX[accent]} strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

function IconBtn({ children, onClick, label, active, dark, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
      ${active ? (dark ? 'bg-white/15 text-white' : 'bg-slate-900 text-white') : (dark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')}
      ${className}`}
    >
      {children}
    </button>
  );
}

/* ============================== CONFETTI ============================== */

function ConfettiBurst() {
  const pieces = useMemo(() => Array.from({ length: 26 }).map(() => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.25,
    drift: (Math.random() - 0.5) * 220,
    color: HEX[COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)]],
    size: 6 + Math.random() * 6,
  })), []);
  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden z-[60]">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size, height: p.size * 0.6,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ============================== TOAST ============================== */

function ToastHost() {
  const { toast } = useApp();
  if (!toast) return null;
  const tone = toast.type === 'danger' ? 'border-red-400/40 text-red-200' : toast.type === 'success' ? 'border-emerald-400/40 text-emerald-200' : 'border-indigo-400/40 text-indigo-200';
  return (
    <div className="fixed bottom-5 right-5 z-[70] animate-card-in">
      <div className={`flex items-center gap-2 rounded-2xl bg-slate-900/90 backdrop-blur-xl border ${tone} px-4 py-3 shadow-2xl text-sm font-medium`}>
        {toast.type === 'success' ? <CheckCircle2 size={16} /> : toast.type === 'danger' ? <AlertTriangle size={16} /> : <Sparkles size={16} />}
        {toast.message}
      </div>
    </div>
  );
}

/* ============================== SIDEBAR ============================== */

function Sidebar() {
  const { darkMode, view, setView, accent } = useApp();
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex fixed inset-y-0 left-0 w-64 flex-col z-40 border-r ${darkMode ? 'bg-slate-950/60 border-white/10' : 'bg-white/70 border-slate-200'} backdrop-blur-xl`}>
        <div className="flex items-center gap-2.5 px-6 h-20">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-${accent}-500 to-${ACCENT_PAIR[accent]}-500 flex items-center justify-center shadow-lg shadow-${accent}-500/30`}>
            <ListChecks size={18} className="text-white" />
          </div>
          <span className={`ff-display text-lg font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>TaskFlow</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            const activeNow = view === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setView(it.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${activeNow
                  ? `bg-gradient-to-r from-${accent}-500/20 to-${ACCENT_PAIR[accent]}-500/10 text-${accent === 'indigo' ? 'indigo' : accent}-300 ${darkMode ? '' : `text-${accent}-700`}`
                  : darkMode ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <Icon size={17} />
                {it.label}
              </button>
            );
          })}
        </nav>
        <div className={`mx-4 mb-5 rounded-2xl p-4 ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-100'}`}>
          <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Keyboard tip: press <kbd className={`px-1.5 py-0.5 rounded-md text-[11px] ${darkMode ? 'bg-white/10 text-slate-200' : 'bg-white text-slate-700 border border-slate-200'}`}>N</kbd> to add a task fast.
          </p>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className={`md:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around items-center h-16 border-t backdrop-blur-xl ${darkMode ? 'bg-slate-950/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>
        {items.map((it) => {
          const Icon = it.icon;
          const activeNow = view === it.id;
          return (
            <button key={it.id} onClick={() => setView(it.id)} className="flex flex-col items-center gap-1 px-4 py-1.5">
              <Icon size={19} className={activeNow ? `text-${accent}-400` : darkMode ? 'text-slate-500' : 'text-slate-400'} />
              <span className={`text-[10px] font-medium ${activeNow ? (darkMode ? 'text-white' : 'text-slate-900') : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{it.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

/* ============================== TOP BAR ============================== */

function greetingForHour() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function TopBar() {
  const {
    darkMode, toggleDarkMode, search, setSearch, stats, openNewTaskForm, accent,
  } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const { tasks } = useApp();
  const overdueList = tasks.filter((t) => isOverdue(t) && !t.archived).slice(0, 4);

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-xl border-b ${darkMode ? 'bg-slate-950/50 border-white/10' : 'bg-slate-50/70 border-slate-200'}`}>
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-20 max-w-6xl mx-auto">
        <div className="md:hidden flex items-center gap-2 mr-1">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-${accent}-500 to-${ACCENT_PAIR[accent]}-500 flex items-center justify-center`}>
            <ListChecks size={15} className="text-white" />
          </div>
        </div>

        <div className="hidden sm:block">
          <p className={`ff-display text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {greetingForHour()}, Alex
          </p>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {stats.pending} task{stats.pending === 1 ? '' : 's'} left
          </p>
        </div>

        <div className="flex-1" />

        <div className="relative hidden sm:block w-64">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, tags, notes…"
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition-colors ${darkMode ? 'bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:bg-white/10' : 'bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-slate-300'}`}
          />
        </div>

        <div className="relative">
          <IconBtn dark={darkMode} label="Notifications" onClick={() => setNotifOpen((v) => !v)}>
            <Bell size={17} />
            {overdueList.length > 0 && (
              <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-950" />
            )}
          </IconBtn>
          {notifOpen && (
            <div className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-3 animate-card-in ${darkMode ? 'bg-slate-900/95 border-white/10' : 'bg-white border-slate-200'}`}>
              <p className={`text-xs font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Overdue tasks</p>
              {overdueList.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>You're all caught up.</p>
              ) : (
                <ul className="space-y-1.5">
                  {overdueList.map((t) => (
                    <li key={t.id} className={`text-sm flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      <AlertTriangle size={13} className="text-red-400 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <IconBtn dark={darkMode} label="Toggle theme" onClick={toggleDarkMode}>
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </IconBtn>

        <button
          onClick={openNewTaskForm}
          className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-${accent}-500 to-${ACCENT_PAIR[accent]}-500 hover:brightness-110 transition shadow-lg shadow-${accent}-500/30`}
        >
          <Plus size={15} /> New task
        </button>

        <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-${accent}-400 to-${ACCENT_PAIR[accent]}-600 flex items-center justify-center text-white text-sm font-semibold ff-display`}>
          A
        </div>
      </div>

      {/* mobile search */}
      <div className="sm:hidden px-4 pb-3 -mt-1">
        <div className="relative">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500' : 'bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400'}`}
          />
        </div>
      </div>
    </header>
  );
}

/* ============================== HERO ============================== */

function Hero() {
  const { darkMode, openNewTaskForm, accent } = useApp();
  return (
    <section className={`relative overflow-hidden rounded-3xl p-7 sm:p-10 mb-6 border animate-card-in ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
      <div className="relative z-10 max-w-md">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mb-4 ${softIconClasses(accent, darkMode)}`}>
          <Sparkles size={12} /> Today's focus
        </span>
        <h1 className={`ff-display text-3xl sm:text-4xl font-bold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Organize <span className={`text-transparent bg-clip-text bg-gradient-to-r from-${accent}-400 to-${ACCENT_PAIR[accent]}-400`}>Your Life</span>
        </h1>
        <p className={`text-sm sm:text-base mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          One calm place for every task, deadline, and idea — so your day runs on a plan, not on memory.
        </p>
        <button
          onClick={openNewTaskForm}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-${accent}-500 to-${ACCENT_PAIR[accent]}-500 hover:scale-[1.03] active:scale-[0.98] transition-transform shadow-lg shadow-${accent}-500/30`}
        >
          <Plus size={16} /> Create a task
        </button>
      </div>
      <div aria-hidden className="hidden sm:block absolute -right-6 -bottom-10 opacity-90">
        <div className={`w-44 h-44 rounded-3xl rotate-12 border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} flex items-center justify-center`}>
          <ListChecks size={64} className={darkMode ? `text-${accent}-400/70` : `text-${accent}-300`} />
        </div>
      </div>
    </section>
  );
}

/* ============================== STATS ============================== */

function StatCard({ icon: Icon, label, value, color, dark, suffix = '' }) {
  const display = useCountUp(value);
  return (
    <div className={`group rounded-2xl p-4 border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl animate-card-in ${dark ? 'bg-white/5 border-white/10 hover:bg-white/[0.07]' : 'bg-white border-slate-200 hover:shadow-slate-200/60'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${softIconClasses(color, dark)}`}>
        <Icon size={16} />
      </div>
      <p className={`ff-display text-2xl font-bold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{display}{suffix}</p>
      <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
    </div>
  );
}

function StatsRow() {
  const { stats, darkMode, accent } = useApp();
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <StatCard icon={ListChecks} label="Total tasks" value={stats.total} color="indigo" dark={darkMode} />
      <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="emerald" dark={darkMode} />
      <StatCard icon={Circle} label="Pending" value={stats.pending} color="amber" dark={darkMode} />
      <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} color="red" dark={darkMode} />
      <div className={`col-span-2 sm:col-span-1 rounded-2xl p-4 border flex items-center gap-3 animate-card-in ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
        <ProgressRing pct={stats.completionPct} dark={darkMode} accent={accent} />
        <div>
          <p className={`ff-display text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.completionPct}%</p>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Completion</p>
        </div>
      </div>
    </section>
  );
}

/* ============================== FILTERS BAR ============================== */

function FiltersBar() {
  const {
    darkMode, filter, setFilter, categoryFilter, setCategoryFilter,
    priorityFilter, setPriorityFilter, sortBy, setSortBy, accent,
  } = useApp();
  const [openMenu, setOpenMenu] = useState(null);

  return (
    <div className="mb-4 space-y-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors
            ${filter === f.id
              ? `bg-gradient-to-r from-${accent}-500 to-${ACCENT_PAIR[accent]}-500 text-white border-transparent shadow-md shadow-${accent}-500/20`
              : darkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* category */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'cat' ? null : 'cat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${darkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            <Tag size={12} /> {categoryFilter === 'all' ? 'Category' : getCategory(categoryFilter).label} <ChevronDown size={12} />
          </button>
          {openMenu === 'cat' && (
            <div className={`absolute z-20 mt-1 w-44 max-h-64 overflow-auto rounded-xl border shadow-xl p-1 animate-card-in ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <button onClick={() => { setCategoryFilter('all'); setOpenMenu(null); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}>All categories</button>
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => { setCategoryFilter(c.id); setOpenMenu(null); }} className={`w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <c.icon size={12} className={`text-${c.color}-400`} /> {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* priority */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'pri' ? null : 'pri')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${darkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            <Flame size={12} /> {priorityFilter === 'all' ? 'Priority' : getPriority(priorityFilter).label} <ChevronDown size={12} />
          </button>
          {openMenu === 'pri' && (
            <div className={`absolute z-20 mt-1 w-36 rounded-xl border shadow-xl p-1 animate-card-in ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <button onClick={() => { setPriorityFilter('all'); setOpenMenu(null); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}>All priorities</button>
              {PRIORITIES.map((p) => (
                <button key={p.id} onClick={() => { setPriorityFilter(p.id); setOpenMenu(null); }} className={`w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full bg-${p.color}-400`} /> {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* sort */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${darkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            <ArrowUpDown size={12} /> {SORTS.find((s) => s.id === sortBy).label} <ChevronDown size={12} />
          </button>
          {openMenu === 'sort' && (
            <div className={`absolute right-0 z-20 mt-1 w-44 rounded-xl border shadow-xl p-1 animate-card-in ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              {SORTS.map((s) => (
                <button key={s.id} onClick={() => { setSortBy(s.id); setOpenMenu(null); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}>{s.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== TASK CARD ============================== */

function TaskCard({ task }) {
  const {
    darkMode, toggleComplete, toggleFavorite, toggleArchive, duplicateTask,
    deleteTask, openEditTaskForm, confirmDeleteId, setConfirmDeleteId,
  } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const cat = getCategory(task.category);
  const pri = getPriority(task.priority);
  const accentColor = task.color || cat.color;
  const overdue = isOverdue(task);

  return (
    <div
      className={`relative flex gap-3 rounded-2xl p-4 border transition-all duration-300 animate-card-in
      ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/[0.08]' : 'bg-white border-slate-200 hover:shadow-lg hover:shadow-slate-200/60'}
      hover:-translate-y-0.5 ${task.completed ? 'opacity-60' : ''}`}
      style={{ borderLeft: `3px solid ${HEX[accentColor]}` }}
    >
      <button
        onClick={() => toggleComplete(task.id)}
        aria-label={task.completed ? 'Mark as pending' : 'Mark as complete'}
        className="mt-0.5 shrink-0"
      >
        {task.completed
          ? <CheckCircle2 size={20} className="text-emerald-400" />
          : <Circle size={20} className={darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-300 hover:text-slate-500'} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-medium text-sm leading-snug ${task.completed ? 'line-through' : ''} ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
            {task.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => toggleFavorite(task.id)} aria-label="Toggle favorite">
              <Star size={15} className={task.favorite ? 'fill-amber-400 text-amber-400' : darkMode ? 'text-slate-500' : 'text-slate-300'} />
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)} aria-label="Task menu" className={`p-1 rounded-lg ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}>
                <MoreVertical size={15} />
              </button>
              {menuOpen && (
                <div className={`absolute right-0 z-20 mt-1 w-36 rounded-xl border shadow-xl p-1 animate-card-in ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                  <button onClick={() => { openEditTaskForm(task); setMenuOpen(false); }} className={`w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}><Pencil size={12} /> Edit</button>
                  <button onClick={() => { duplicateTask(task.id); setMenuOpen(false); }} className={`w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}><Copy size={12} /> Duplicate</button>
                  <button onClick={() => { toggleArchive(task.id); setMenuOpen(false); }} className={`w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}>
                    {task.archived ? <ArchiveRestore size={12} /> : <Archive size={12} />} {task.archived ? 'Restore' : 'Archive'}
                  </button>
                  <button onClick={() => { setConfirmDeleteId(task.id); setMenuOpen(false); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10"><Trash2 size={12} /> Delete</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {task.description && (
          <p className={`text-xs mt-1 line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{task.description}</p>
        )}

        <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeClasses(cat.color, darkMode)}`}>
            <cat.icon size={10} /> {cat.label}
          </span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeClasses(pri.color, darkMode)}`}>
            <Flame size={10} /> {pri.label}
          </span>
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${overdue ? badgeClasses('red', darkMode) : darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              {overdue ? <AlertTriangle size={10} /> : <Calendar size={10} />}
              {formatDue(task.dueDate)}{task.dueTime ? ` · ${task.dueTime}` : ''}
            </span>
          )}
          {task.tags.map((tag) => (
            <span key={tag} className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              <Tag size={9} /> {tag}
            </span>
          ))}
        </div>
      </div>

      {confirmDeleteId === task.id && (
        <div className={`absolute inset-0 rounded-2xl flex items-center justify-center gap-3 backdrop-blur-sm z-10 ${darkMode ? 'bg-slate-950/85' : 'bg-white/90'}`}>
          <span className={`text-xs font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Delete this task?</span>
          <button onClick={() => deleteTask(task.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600">Delete</button>
          <button onClick={() => setConfirmDeleteId(null)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${darkMode ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>Cancel</button>
        </div>
      )}
    </div>
  );
}

/* ============================== EMPTY STATE ============================== */

function EmptyState() {
  const { darkMode, openNewTaskForm, accent, filter } = useApp();
  const copy = filter === 'all'
    ? { title: 'No tasks yet', sub: 'Create your first task and watch this space come to life.' }
    : { title: `Nothing in “${FILTERS.find((f) => f.id === filter)?.label}”`, sub: 'Try a different filter, or add a new task.' };
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 rounded-2xl border animate-card-in ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${softIconClasses(accent, darkMode)}`}>
        <Inbox size={24} />
      </div>
      <p className={`ff-display font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{copy.title}</p>
      <p className={`text-sm mt-1 mb-5 max-w-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{copy.sub}</p>
      <button onClick={openNewTaskForm} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-${accent}-500 to-${ACCENT_PAIR[accent]}-500 hover:brightness-110 transition`}>
        <Plus size={15} /> Create a task
      </button>
    </div>
  );
}

/* ============================== TASK LIST ============================== */

function TaskList() {
  const { filteredTasks } = useApp();
  if (filteredTasks.length === 0) return <EmptyState />;
  return (
    <div className="space-y-2.5">
      {filteredTasks.map((t) => <TaskCard key={t.id} task={t} />)}
    </div>
  );
}

/* ============================== TASK FORM (MODAL) ============================== */

const emptyDraft = {
  title: '', description: '', category: 'work', priority: 'medium',
  dueDate: '', dueTime: '', tags: '', color: null, reminder: false,
};

function TaskForm() {
  const { darkMode, formOpen, closeTaskForm, editingTask, addTask, updateTask, accent } = useApp();
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTask) {
      setDraft({
        title: editingTask.title,
        description: editingTask.description,
        category: editingTask.category,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate,
        dueTime: editingTask.dueTime,
        tags: editingTask.tags.join(', '),
        color: editingTask.color,
        reminder: editingTask.reminder || false,
      });
    } else {
      setDraft(emptyDraft);
    }
    setError('');
  }, [editingTask, formOpen]);

  if (!formOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!draft.title.trim()) { setError('Give your task a title to continue.'); return; }
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      priority: draft.priority,
      dueDate: draft.dueDate,
      dueTime: draft.dueTime,
      tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean),
      color: draft.color,
      reminder: draft.reminder,
    };
    if (editingTask) updateTask(editingTask.id, payload);
    else addTask(payload);
  }

  const inputCls = `w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors ${darkMode ? 'bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:border-white/30' : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-slate-400'}`;
  const labelCls = `block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeTaskForm} />
      <form
        onSubmit={handleSubmit}
        className={`relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 animate-card-in ${darkMode ? 'bg-slate-900/95 border-white/10' : 'bg-white border-slate-200'}`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className={`ff-display text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{editingTask ? 'Edit task' : 'New task'}</h2>
          <button type="button" onClick={closeTaskForm} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Title</label>
            <input autoFocus value={draft.title} onChange={(e) => { setDraft({ ...draft, title: e.target.value }); setError(''); }} placeholder="e.g. Prep client onboarding email" className={inputCls} />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Optional details…" className={`${inputCls} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Category</label>
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <div className="flex gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setDraft({ ...draft, priority: p.id })}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${draft.priority === p.id ? badgeClasses(p.color, darkMode) : darkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-400'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Due date</label>
              <input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Time</label>
              <input type="time" value={draft.dueTime} onChange={(e) => setDraft({ ...draft, dueTime: e.target.value })} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Tags <span className="opacity-60">(comma separated)</span></label>
            <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="design, urgent" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Color label</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDraft({ ...draft, color: null })} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${draft.color === null ? 'border-slate-400' : 'border-transparent'} ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
                <Minus size={12} className={darkMode ? 'text-slate-400' : 'text-slate-400'} />
              </button>
              {COLOR_SWATCHES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setDraft({ ...draft, color: c })}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${draft.color === c ? 'scale-110 border-white/70' : 'border-transparent'}`}
                  style={{ backgroundColor: HEX[c] }}
                  aria-label={`${c} label`}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={draft.reminder} onChange={(e) => setDraft({ ...draft, reminder: e.target.checked })} className="w-4 h-4 rounded accent-indigo-500" />
            <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Remind me before it's due</span>
          </label>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <button type="button" onClick={() => setDraft(emptyDraft)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${darkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Reset</button>
          <button type="submit" className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-${accent}-500 to-${ACCENT_PAIR[accent]}-500 hover:brightness-110 transition`}>
            {editingTask ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ============================== ANALYTICS ============================== */

function chartTooltipStyle(darkMode) {
  return {
    backgroundColor: darkMode ? 'rgba(15,23,42,0.95)' : '#ffffff',
    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
    borderRadius: 12,
    fontSize: 12,
    color: darkMode ? '#e2e8f0' : '#334155',
  };
}

function AnalyticsPanel() {
  const { tasks, stats, darkMode, accent } = useApp();

  const categoryData = useMemo(() => {
    const counts = {};
    tasks.filter((t) => !t.archived).forEach((t) => { counts[t.category] = (counts[t.category] || 0) + 1; });
    return Object.entries(counts).map(([id, value]) => ({ name: getCategory(id).label, value, color: getCategory(id).color }));
  }, [tasks]);

  const weekly = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const created = tasks.filter((t) => t.createdAt && t.createdAt.slice(0, 10) === iso).length;
      const completed = tasks.filter((t) => t.completedAt && t.completedAt.slice(0, 10) === iso).length;
      days.push({ day: label, created, completed });
    }
    let cum = 0;
    const trend = days.map((d) => { cum += d.completed; return { day: d.day, total: cum }; });
    return { days, trend };
  }, [tasks]);

  const axisColor = darkMode ? '#64748b' : '#94a3b8';

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`ff-display text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Analytics</h2>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>How your week is actually going, at a glance.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={ListChecks} label="Total tasks" value={stats.total} color="indigo" dark={darkMode} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="emerald" dark={darkMode} />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} color="red" dark={darkMode} />
        <StatCard icon={PartyPopper} label="Completion" value={stats.completionPct} suffix="%" color={accent} dark={darkMode} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className={`rounded-2xl border p-5 animate-card-in ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Category distribution</p>
          {categoryData.length === 0 ? (
            <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Add tasks to see this chart fill in.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={HEX[entry.color]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle(darkMode)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`rounded-2xl border p-5 animate-card-in ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Weekly activity</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekly.days}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9'} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={chartTooltipStyle(darkMode)} />
              <Bar dataKey="created" name="Created" fill={HEX.indigo} radius={[5, 5, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill={HEX.emerald} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`lg:col-span-2 rounded-2xl border p-5 animate-card-in ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Completion trend (7 days)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weekly.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9'} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={chartTooltipStyle(darkMode)} />
              <Line type="monotone" dataKey="total" name="Cumulative completed" stroke={HEX[accent]} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ============================== SETTINGS ============================== */

function SettingsPanel() {
  const {
    darkMode, toggleDarkMode, accent, setAccent, density, setDensity,
    notifications, setNotifications, resetAllData, exportData, importData, showToast,
  } = useApp();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const fileInputRef = useRef(null);

  function handleImportClick() { fileInputRef.current?.click(); }
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('bad format');
        importData(parsed);
      } catch {
        showToast('That file could not be read as task data.', 'danger');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const cardCls = `rounded-2xl border p-5 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`;
  const rowLabel = `text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`;
  const rowSub = `text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className={`ff-display text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Settings</h2>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tune the workspace to fit how you work.</p>
      </div>

      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4">
          <div><p className={rowLabel}>Appearance</p><p className={rowSub}>Switch between light and dark surfaces.</p></div>
          <div className={`flex rounded-xl p-1 ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
            <button onClick={() => darkMode && toggleDarkMode()} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${!darkMode ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}><Sun size={13} /> Light</button>
            <button onClick={() => !darkMode && toggleDarkMode()} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${darkMode ? 'bg-slate-700 shadow text-white' : 'text-slate-400'}`}><Moon size={13} /> Dark</button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div><p className={rowLabel}>Accent color</p><p className={rowSub}>Colors buttons, highlights, and charts.</p></div>
          <div className="flex gap-2">
            {ACCENT_OPTIONS.map((c) => (
              <button key={c} onClick={() => setAccent(c)} className={`w-7 h-7 rounded-full border-2 transition-transform ${accent === c ? 'scale-110 border-white/70' : 'border-transparent'}`} style={{ backgroundColor: HEX[c] }} aria-label={`${c} accent`} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div><p className={rowLabel}>Density</p><p className={rowSub}>Comfortable gives cards more breathing room.</p></div>
          <div className={`flex rounded-xl p-1 ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
            <button onClick={() => setDensity('comfortable')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${density === 'comfortable' ? (darkMode ? 'bg-white/15 text-white' : 'bg-white shadow text-slate-900') : 'text-slate-400'}`}>Comfortable</button>
            <button onClick={() => setDensity('compact')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${density === 'compact' ? (darkMode ? 'bg-white/15 text-white' : 'bg-white shadow text-slate-900') : 'text-slate-400'}`}>Compact</button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div><p className={rowLabel}>Notifications</p><p className={rowSub}>Show a badge when tasks are overdue.</p></div>
          <button
            onClick={() => setNotifications((v) => !v)}
            className={`w-11 h-6 rounded-full relative transition-colors ${notifications ? `bg-${accent}-500` : darkMode ? 'bg-white/10' : 'bg-slate-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifications ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      <div className={cardCls}>
        <p className={`${rowLabel} mb-1`}>Your data</p>
        <p className={`${rowSub} mb-4`}>Everything lives in this session — export a backup any time.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportData} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium ${darkMode ? 'bg-white/10 text-slate-200 hover:bg-white/15' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><Download size={13} /> Export JSON</button>
          <button onClick={handleImportClick} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium ${darkMode ? 'bg-white/10 text-slate-200 hover:bg-white/15' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><Upload size={13} /> Import JSON</button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileChange} hidden />
          {!confirmingReset ? (
            <button onClick={() => setConfirmingReset(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/15"><RotateCcw size={13} /> Reset all data</button>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Clear every task?</span>
              <button onClick={() => { resetAllData(); setConfirmingReset(false); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600">Yes, reset</button>
              <button onClick={() => setConfirmingReset(false)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${darkMode ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>Cancel</button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== APP ROOT ============================== */

export default function TaskFlowApp() {
  const [tasks, setTasks] = useState(makeSeedTasks);
  const [darkMode, setDarkMode] = useState(true);
  const [accent, setAccent] = useState('indigo');
  const [density, setDensity] = useState('comfortable');
  const [notifications, setNotifications] = useState(true);

  const [view, setView] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [celebrate, setCelebrate] = useState(false);

  function showToast(message, type = 'info') {
    setToast({ message, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2600);
  }

  function openNewTaskForm() { setEditingTask(null); setFormOpen(true); }
  function openEditTaskForm(task) { setEditingTask(task); setFormOpen(true); }
  function closeTaskForm() { setFormOpen(false); setEditingTask(null); }

  function addTask(payload) {
    const next = { id: uid(), completed: false, favorite: false, archived: false, createdAt: new Date().toISOString(), completedAt: null, ...payload };
    setTasks((prev) => [next, ...prev]);
    closeTaskForm();
    showToast('Task added', 'success');
  }
  function updateTask(id, payload) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...payload } : t)));
    closeTaskForm();
    showToast('Task updated', 'success');
  }
  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setConfirmDeleteId(null);
    showToast('Task deleted', 'danger');
  }
  function toggleComplete(id) {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const completed = !t.completed;
      if (completed) { setCelebrate(true); window.setTimeout(() => setCelebrate(false), 1100); }
      return { ...t, completed, completedAt: completed ? new Date().toISOString() : null };
    }));
  }
  function toggleFavorite(id) { setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t))); }
  function toggleArchive(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, archived: !t.archived } : t)));
    showToast('Updated', 'success');
  }
  function duplicateTask(id) {
    setTasks((prev) => {
      const src = prev.find((t) => t.id === id);
      if (!src) return prev;
      const copy = { ...src, id: uid(), title: `${src.title} (copy)`, completed: false, completedAt: null, createdAt: new Date().toISOString() };
      return [copy, ...prev];
    });
    showToast('Task duplicated', 'success');
  }
  function resetAllData() { setTasks([]); showToast('All tasks cleared', 'danger'); }
  function exportData() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'taskflow-export.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast('Data exported', 'success');
  }
  function importData(parsed) {
    const cleaned = parsed.filter((t) => t && typeof t.title === 'string').map((t) => ({
      id: uid(), title: t.title, description: t.description || '', category: getCategory(t.category).id,
      priority: getPriority(t.priority).id, dueDate: t.dueDate || '', dueTime: t.dueTime || '',
      tags: Array.isArray(t.tags) ? t.tags : [], color: t.color || null, completed: !!t.completed,
      favorite: !!t.favorite, archived: !!t.archived, createdAt: t.createdAt || new Date().toISOString(),
      completedAt: t.completedAt || null,
    }));
    setTasks(cleaned);
    showToast(`Imported ${cleaned.length} task${cleaned.length === 1 ? '' : 's'}`, 'success');
  }

  // keyboard shortcuts: N = new task, Esc = close modal
  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === 'Escape') { closeTaskForm(); setConfirmDeleteId(null); }
      if (!typing && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); openNewTaskForm(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const today = todayISO();

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (filter !== 'archived') list = list.filter((t) => !t.archived);
    if (filter === 'completed') list = list.filter((t) => t.completed);
    else if (filter === 'pending') list = list.filter((t) => !t.completed);
    else if (filter === 'favorites') list = list.filter((t) => t.favorite);
    else if (filter === 'archived') list = list.filter((t) => t.archived);
    else if (filter === 'today') list = list.filter((t) => t.dueDate === today);
    else if (filter === 'overdue') list = list.filter((t) => isOverdue(t));

    if (categoryFilter !== 'all') list = list.filter((t) => t.category === categoryFilter);
    if (priorityFilter !== 'all') list = list.filter((t) => t.priority === priorityFilter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => (
        t.title.toLowerCase().includes(q)
        || t.description.toLowerCase().includes(q)
        || t.tags.some((tag) => tag.toLowerCase().includes(q))
        || getCategory(t.category).label.toLowerCase().includes(q)
      ));
    }

    const priorityRank = { high: 0, medium: 1, low: 2 };
    list = [...list].sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      if (sortBy === 'priority') return priorityRank[a.priority] - priorityRank[b.priority];
      if (sortBy === 'dueDate') return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
      if (sortBy === 'az') return a.title.localeCompare(b.title);
      return 0;
    });
    return list;
  }, [tasks, filter, categoryFilter, priorityFilter, search, sortBy, today]);

  const stats = useMemo(() => {
    const active = tasks.filter((t) => !t.archived);
    const total = active.length;
    const completed = active.filter((t) => t.completed).length;
    const pending = total - completed;
    const overdue = active.filter((t) => isOverdue(t)).length;
    const todayCount = active.filter((t) => t.dueDate === today).length;
    const completionPct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, overdue, todayCount, completionPct };
  }, [tasks, today]);

  const ctx = {
    tasks, filteredTasks, stats, darkMode, accent, density, notifications, search, filter,
    categoryFilter, priorityFilter, sortBy, view, formOpen, editingTask, confirmDeleteId, toast,
    setView, setSearch, setFilter, setCategoryFilter, setPriorityFilter, setSortBy, setAccent,
    setDensity, setNotifications, setConfirmDeleteId,
    toggleDarkMode: () => setDarkMode((v) => !v),
    openNewTaskForm, openEditTaskForm, closeTaskForm,
    addTask, updateTask, deleteTask, toggleComplete, toggleFavorite, toggleArchive, duplicateTask,
    resetAllData, exportData, importData, showToast,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <div className={`ff-body min-h-screen relative transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
          .ff-display { font-family: 'Poppins', ui-sans-serif, system-ui, sans-serif; }
          .ff-body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { scrollbar-width: none; }
          @keyframes blobFloat { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-40px) scale(1.08); } 66% { transform: translate(-20px,20px) scale(0.95); } }
          .animate-blob { animation: blobFloat 18s ease-in-out infinite; }
          @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-card-in { animation: fadeSlideUp 0.35s ease-out both; }
          @keyframes confettiFall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) translateX(var(--drift)) rotate(360deg); opacity: 0; } }
          .confetti-piece { animation: confettiFall 1.1s ease-in forwards; }
        `}</style>

        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] bg-violet-600/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '8s' }} />
        </div>

        <Sidebar />

        <div className="md:pl-64 pb-20 md:pb-0 relative">
          <TopBar />
          <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
            {view === 'dashboard' && (
              <>
                <Hero />
                <StatsRow />
                <FiltersBar />
                <TaskList />
              </>
            )}
            {view === 'analytics' && <AnalyticsPanel />}
            {view === 'settings' && <SettingsPanel />}
          </main>
        </div>

        <TaskForm />
        {celebrate && <ConfettiBurst />}
        <ToastHost />
      </div>
    </AppCtx.Provider>
  );
}
