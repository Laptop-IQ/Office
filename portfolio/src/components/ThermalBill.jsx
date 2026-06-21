import React, { useState, useEffect } from "react";
import { toWords } from "number-to-words";

const getCurrentDateTime = () => {
  const now = new Date();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(now.getDate()).padStart(2, "0");
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day} ${month} ${year} ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

const getNextBillNo = (lastSerial) => {
  const next = lastSerial + 35;
  return { billNo: `FR65/2627/${String(next).padStart(6, "0")}`, serial: next };
};

const generateOrderId = () => {
  const prefix = "czh83eZ55qY0FK";
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++)
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  return prefix + suffix;
};

const restaurantDefaults = {
  title: "Sagar Ratna",
  branch: "Sagar Ratna Kosi Kalan",
  franchise: "Franchisee of Agrawal Hotel and Restaurant",
  address1: "Sagar Ratna Hotel Near Kotwan",
  address2: "Police Chowki NH -19 Kosi Kalan",
  city: "Mathura (U.P)",
  phone: "8077743831",
  email: "customercare@sagarratna.in",
  gst: "09ACEFA7387A1ZE",
  dine: "Dine In",
  table: "Table 5",
  user: "kosicsk2",
};

const defaultItems = [
  { id: 1, name: "Sagar Special Yellow Dal Tadka", qty: 1, rate: 250 },
  { id: 2, name: "Roti", qty: 5, rate: 30 },
  { id: 3, name: "Mineral Water", qty: 1, rate: 29.6 },
];

const FONT_FAMILIES = [
  {
    id: "mono",
    label: "Mono (Default)",
    css: "ui-monospace, 'Courier New', monospace",
    google: null,
  },
  {
    id: "courier",
    label: "Courier New",
    css: "'Courier New', Courier, monospace",
    google: null,
  },
  {
    id: "consolas",
    label: "Consolas",
    css: "Consolas, 'Lucida Console', monospace",
    google: null,
  },
  {
    id: "arial",
    label: "Arial",
    css: "Arial, Helvetica, sans-serif",
    google: null,
  },
  {
    id: "verdana",
    label: "Verdana",
    css: "Verdana, Geneva, sans-serif",
    google: null,
  },
  {
    id: "tahoma",
    label: "Tahoma",
    css: "Tahoma, Geneva, sans-serif",
    google: null,
  },
  {
    id: "trebuchet",
    label: "Trebuchet MS",
    css: "'Trebuchet MS', sans-serif",
    google: null,
  },
  {
    id: "calibri",
    label: "Calibri",
    css: "Calibri, 'Segoe UI', sans-serif",
    google: null,
  },
  {
    id: "georgia",
    label: "Georgia",
    css: "Georgia, 'Times New Roman', serif",
    google: null,
  },
  {
    id: "times",
    label: "Times New Roman",
    css: "'Times New Roman', Times, serif",
    google: null,
  },
  {
    id: "garamond",
    label: "Garamond",
    css: "Garamond, 'Times New Roman', serif",
    google: null,
  },
  {
    id: "palatino",
    label: "Palatino",
    css: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    google: null,
  },
  {
    id: "impact",
    label: "Impact",
    css: "Impact, 'Arial Narrow', sans-serif",
    google: null,
  },
  {
    id: "condensed",
    label: "Arial Narrow",
    css: "'Arial Narrow', sans-serif",
    google: null,
  },
  {
    id: "roboto",
    label: "Roboto",
    css: "'Roboto', sans-serif",
    google: "Roboto:wght@400;700",
  },
  {
    id: "opensans",
    label: "Open Sans",
    css: "'Open Sans', sans-serif",
    google: "Open+Sans:wght@400;700",
  },
  {
    id: "lato",
    label: "Lato",
    css: "'Lato', sans-serif",
    google: "Lato:wght@400;700",
  },
  {
    id: "montserrat",
    label: "Montserrat",
    css: "'Montserrat', sans-serif",
    google: "Montserrat:wght@400;700",
  },
  {
    id: "poppins",
    label: "Poppins",
    css: "'Poppins', sans-serif",
    google: "Poppins:wght@400;700",
  },
  {
    id: "nunito",
    label: "Nunito",
    css: "'Nunito', sans-serif",
    google: "Nunito:wght@400;700",
  },
  {
    id: "raleway",
    label: "Raleway",
    css: "'Raleway', sans-serif",
    google: "Raleway:wght@400;700",
  },
  {
    id: "inter",
    label: "Inter",
    css: "'Inter', sans-serif",
    google: "Inter:wght@400;700",
  },
  {
    id: "worksans",
    label: "Work Sans",
    css: "'Work Sans', sans-serif",
    google: "Work+Sans:wght@400;700",
  },
  {
    id: "rubik",
    label: "Rubik",
    css: "'Rubik', sans-serif",
    google: "Rubik:wght@400;700",
  },
  {
    id: "ptsans",
    label: "PT Sans",
    css: "'PT Sans', sans-serif",
    google: "PT+Sans:wght@400;700",
  },
  {
    id: "mukta",
    label: "Mukta",
    css: "'Mukta', sans-serif",
    google: "Mukta:wght@400;700",
  },
  {
    id: "karla",
    label: "Karla",
    css: "'Karla', sans-serif",
    google: "Karla:wght@400;700",
  },
  {
    id: "quicksand",
    label: "Quicksand",
    css: "'Quicksand', sans-serif",
    google: "Quicksand:wght@400;700",
  },
  {
    id: "barlow",
    label: "Barlow",
    css: "'Barlow', sans-serif",
    google: "Barlow:wght@400;700",
  },
  {
    id: "manrope",
    label: "Manrope",
    css: "'Manrope', sans-serif",
    google: "Manrope:wght@400;700",
  },
  {
    id: "heebo",
    label: "Heebo",
    css: "'Heebo', sans-serif",
    google: "Heebo:wght@400;700",
  },
  {
    id: "dmsans",
    label: "DM Sans",
    css: "'DM Sans', sans-serif",
    google: "DM+Sans:wght@400;700",
  },
  {
    id: "outfit",
    label: "Outfit",
    css: "'Outfit', sans-serif",
    google: "Outfit:wght@400;700",
  },
  {
    id: "jost",
    label: "Jost",
    css: "'Jost', sans-serif",
    google: "Jost:wght@400;700",
  },
  {
    id: "merriweather",
    label: "Merriweather",
    css: "'Merriweather', serif",
    google: "Merriweather:wght@400;700",
  },
  {
    id: "playfair",
    label: "Playfair Display",
    css: "'Playfair Display', serif",
    google: "Playfair+Display:wght@400;700",
  },
  {
    id: "lora",
    label: "Lora",
    css: "'Lora', serif",
    google: "Lora:wght@400;700",
  },
  {
    id: "ptserif",
    label: "PT Serif",
    css: "'PT Serif', serif",
    google: "PT+Serif:wght@400;700",
  },
  {
    id: "ptbody",
    label: "Crimson Text",
    css: "'Crimson Text', serif",
    google: "Crimson+Text:wght@400;700",
  },
  {
    id: "ebgaramond",
    label: "EB Garamond",
    css: "'EB Garamond', serif",
    google: "EB+Garamond:wght@400;700",
  },
  {
    id: "domine",
    label: "Domine",
    css: "'Domine', serif",
    google: "Domine:wght@400;700",
  },
  {
    id: "bitter",
    label: "Bitter",
    css: "'Bitter', serif",
    google: "Bitter:wght@400;700",
  },
  {
    id: "cormorant",
    label: "Cormorant",
    css: "'Cormorant', serif",
    google: "Cormorant:wght@400;700",
  },
  {
    id: "spectral",
    label: "Spectral",
    css: "'Spectral', serif",
    google: "Spectral:wght@400;700",
  },
  {
    id: "robotomono",
    label: "Roboto Mono",
    css: "'Roboto Mono', monospace",
    google: "Roboto+Mono:wght@400;700",
  },
  {
    id: "sourcecodepro",
    label: "Source Code Pro",
    css: "'Source Code Pro', monospace",
    google: "Source+Code+Pro:wght@400;700",
  },
  {
    id: "jetbrainsmono",
    label: "JetBrains Mono",
    css: "'JetBrains Mono', monospace",
    google: "JetBrains+Mono:wght@400;700",
  },
  {
    id: "ibmplexmono",
    label: "IBM Plex Mono",
    css: "'IBM Plex Mono', monospace",
    google: "IBM+Plex+Mono:wght@400;700",
  },
  {
    id: "spacemono",
    label: "Space Mono",
    css: "'Space Mono', monospace",
    google: "Space+Mono:wght@400;700",
  },
  {
    id: "inconsolata",
    label: "Inconsolata",
    css: "'Inconsolata', monospace",
    google: "Inconsolata:wght@400;700",
  },
  {
    id: "oswald",
    label: "Oswald (Condensed)",
    css: "'Oswald', sans-serif",
    google: "Oswald:wght@400;700",
  },
  {
    id: "bebasneue",
    label: "Bebas Neue (Display)",
    css: "'Bebas Neue', sans-serif",
    google: "Bebas+Neue",
  },
  {
    id: "anton",
    label: "Anton (Bold Display)",
    css: "'Anton', sans-serif",
    google: "Anton",
  },
  {
    id: "archivoblack",
    label: "Archivo Black",
    css: "'Archivo Black', sans-serif",
    google: "Archivo+Black",
  },
  {
    id: "abril",
    label: "Abril Fatface",
    css: "'Abril Fatface', serif",
    google: "Abril+Fatface",
  },
  {
    id: "pacifico",
    label: "Pacifico (Script)",
    css: "'Pacifico', cursive",
    google: "Pacifico",
  },
  {
    id: "caveat",
    label: "Caveat (Handwritten)",
    css: "'Caveat', cursive",
    google: "Caveat:wght@400;700",
  },
  {
    id: "dancingscript",
    label: "Dancing Script",
    css: "'Dancing Script', cursive",
    google: "Dancing+Script:wght@400;700",
  },
  {
    id: "shadowsinto",
    label: "Shadows Into Light",
    css: "'Shadows Into Light', cursive",
    google: "Shadows+Into+Light",
  },
  {
    id: "permanentmarker",
    label: "Permanent Marker",
    css: "'Permanent Marker', cursive",
    google: "Permanent+Marker",
  },
];

const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?${FONT_FAMILIES.filter(
  (f) => f.google,
)
  .map((f) => `family=${f.google}`)
  .join("&")}&display=swap`;

const FONT_SIZE_DEFAULT = 12;
const FONT_SIZE_MIN = 9;
const FONT_SIZE_MAX = 18;

const VIEW = { LIST: "list", EDITOR: "editor", PREVIEW: "preview" };

export default function ThermalBill() {
  const [view, setView] = useState(VIEW.LIST);
  const [bill, setBill] = useState({
    ...restaurantDefaults,
    date: getCurrentDateTime(),
    billNo: "FR65/2627/001689",
    orderId: generateOrderId(),
  });
  const [items, setItems] = useState(defaultItems);
  const [savedBills, setSavedBills] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [storageStatus, setStorageStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastSerial, setLastSerial] = useState(1689);
  const [fontFamily, setFontFamily] = useState("mono");
  const [fontSize, setFontSize] = useState(FONT_SIZE_DEFAULT);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    try {
      const bills = localStorage.getItem("thermalBills");
      const serial = localStorage.getItem("lastBillSerial");
      const savedFontFamily = localStorage.getItem("billFontFamily");
      const savedFontSize = localStorage.getItem("billFontSize");
      const savedDarkMode = localStorage.getItem("billDarkMode");
      if (serial) setLastSerial(parseInt(serial, 10));
      if (bills) setSavedBills(JSON.parse(bills));
      if (savedFontFamily) setFontFamily(savedFontFamily);
      if (savedFontSize) setFontSize(parseInt(savedFontSize, 10));
      if (savedDarkMode) setDarkMode(savedDarkMode === "true");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (document.getElementById("thermal-bill-google-fonts")) return;
    const link = document.createElement("link");
    link.id = "thermal-bill-google-fonts";
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, []);

  const persistBills = async (bills, serial) => {
    try {
      localStorage.setItem("thermalBills", JSON.stringify(bills));
      localStorage.setItem("lastBillSerial", String(serial));
      return true;
    } catch (err) {
      setStorageStatus("⚠️ Storage error: " + err.message);
      return false;
    }
  };

  const updateFontFamily = (id) => {
    setFontFamily(id);
    try {
      localStorage.setItem("billFontFamily", id);
    } catch (err) {
      console.error(err);
    }
  };

  const updateFontSize = (size) => {
    const clamped = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, size));
    setFontSize(clamped);
    try {
      localStorage.setItem("billFontSize", String(clamped));
    } catch (err) {
      console.error(err);
    }
  };

  const resetFontPrefs = () => {
    updateFontFamily("mono");
    updateFontSize(FONT_SIZE_DEFAULT);
  };

  const activeFontCss =
    FONT_FAMILIES.find((f) => f.id === fontFamily)?.css || FONT_FAMILIES[0].css;

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    try {
      localStorage.setItem("billDarkMode", String(next));
    } catch (err) {
      console.error(err);
    }
  };

  const pageBg = darkMode
    ? "bg-neutral-900 text-neutral-100"
    : "bg-gray-200 text-black";
  const cardBg = darkMode
    ? "bg-neutral-800 text-neutral-100"
    : "bg-white text-black";
  const cardBorder = darkMode ? "border-neutral-700" : "border-gray-300";
  const inputBg = darkMode
    ? "bg-neutral-900 border-neutral-700 text-neutral-100 placeholder-neutral-500"
    : "bg-white border-gray-300 text-black";
  const mutedText = darkMode ? "text-neutral-400" : "text-gray-600";

  const subtotal = items.reduce((acc, item) => acc + item.qty * item.rate, 0);
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const actualTotal = subtotal + cgst + sgst;
  const grandTotal = Math.round(actualTotal);
  const roundedAmount = (grandTotal - actualTotal).toFixed(2);
  const totalQty = items.reduce((acc, item) => acc + Number(item.qty), 0);

  const convertAmountToWords = (amount) => {
    const rupees = Math.floor(amount);
    const paisa = Math.round((amount - rupees) * 100);
    return `${toWords(rupees)} Indian rupee and ${toWords(paisa)} Paisa only`;
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === "name" ? value : Number(value);
    setItems(updated);
  };

  const addItem = () =>
    setItems([...items, { id: Date.now(), name: "", qty: 1, rate: 0 }]);
  const deleteItem = (index) => setItems(items.filter((_, i) => i !== index));

  const startNewBill = () => {
    const { billNo, serial } = getNextBillNo(lastSerial);
    setLastSerial(serial);
    setBill({
      ...restaurantDefaults,
      date: getCurrentDateTime(),
      billNo,
      orderId: generateOrderId(),
    });
    setItems(defaultItems);
    setEditingId(null);
    setStorageStatus("");
    setView(VIEW.EDITOR);
  };

  const startEditBill = (saved) => {
    setEditingId(saved.id);
    setBill(saved.bill);
    setItems(saved.items);
    setStorageStatus("");
    setView(VIEW.EDITOR);
  };

  const saveBill = async () => {
    let updatedBills;
    if (editingId !== null) {
      updatedBills = savedBills.map((b) =>
        b.id === editingId ? { ...b, bill, items, grandTotal } : b,
      );
    } else {
      const newEntry = { id: Date.now(), bill, items, grandTotal };
      updatedBills = [...savedBills, newEntry];
      setEditingId(newEntry.id);
    }
    const ok = await persistBills(updatedBills, lastSerial);
    if (ok) {
      setSavedBills(updatedBills);
      setStorageStatus("✅ Bill saved successfully!");
      setTimeout(() => setStorageStatus(""), 3000);
    }
  };

  const printAndSave = async () => {
    await saveBill();
    window.print();
  };

  const deleteSavedBill = async (id) => {
    if (!window.confirm("Kya aap yeh bill delete karna chahte hain?")) return;
    const updated = savedBills.filter((b) => b.id !== id);
    const ok = await persistBills(updated, lastSerial);
    if (ok) setSavedBills(updated);
  };

  // ══════════════════════════════════════════════════════════════════════
  // PRO-LEVEL FONT CONTROLS — dark glassmorphism panel
  // ══════════════════════════════════════════════════════════════════════
  const FontControls = () => {
    const panelBg = darkMode
      ? "bg-[#18181b] border-[#2a2a2e]"
      : "bg-white border-gray-200";
    const rowBg = darkMode ? "bg-[#1f1f23]" : "bg-gray-50";
    const pillBg = darkMode
      ? "bg-[#27272a] text-blue-400 border border-[#3a3a3f]"
      : "bg-blue-50 text-blue-600 border border-blue-100";
    const iconBg = darkMode
      ? "bg-[#27272a] text-neutral-300 border border-[#3a3a3f]"
      : "bg-gray-100 text-gray-600 border border-gray-200";
    const labelColor = darkMode ? "text-neutral-200" : "text-gray-800";
    const sublabel = darkMode ? "text-neutral-500" : "text-gray-400";
    const resetBtn = darkMode
      ? "text-neutral-500 hover:text-neutral-200 hover:bg-[#27272a] border border-transparent hover:border-[#3a3a3f]"
      : "text-gray-400 hover:text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200";
    const divider = darkMode ? "border-[#2a2a2e]" : "border-gray-100";
    const selectStyle = darkMode
      ? "bg-[#1f1f23] border-[#3a3a3f] text-neutral-100 hover:border-[#555] focus:border-blue-500"
      : "bg-white border-gray-200 text-gray-800 hover:border-gray-400 focus:border-blue-500";
    const stepBtn = darkMode
      ? "bg-[#27272a] border border-[#3a3a3f] text-neutral-300 hover:bg-[#333] hover:text-white disabled:opacity-30"
      : "bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-30";

    return (
      <div
        className={`${panelBg} border rounded-lg mb-4 overflow-hidden shadow-sm`}
      >

        <div className="flex items-end gap-3 px-4 py-3">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="relative -mt-10">
              <select
                value={fontFamily}
                onChange={(e) => updateFontFamily(e.target.value)}
                style={{ fontFamily: activeFontCss }}
                className={`w-full appearance-none border rounded-xl pl-3 pr-7 py-2 text-[12px] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${selectStyle}`}
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.id} value={f.id} style={{ fontFamily: f.css }}>
                    {f.label}
                  </option>
                ))}
              </select>
              <span
                className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] ${sublabel}`}
              >
                ▼
              </span>
            </div>
          </div>

          <div
            className={`w-px self-stretch ${darkMode ? "bg-[#2a2a2e]" : "bg-gray-100"}`}
          />

          <div className="flex flex-col gap-1.5 w-36 shrink-0">
          
            <div className="flex items-center -mt-9 gap-1.5">
              <button
                onClick={() => updateFontSize(fontSize - 1)}
                disabled={fontSize <= FONT_SIZE_MIN}
                className={`flex items-center justify-center w-7 h-7 rounded-lg font-bold text-sm transition-all shrink-0 ${stepBtn}`}
              >
                −
              </button>
              <input
                type="range"
                min={FONT_SIZE_MIN}
                max={FONT_SIZE_MAX}
                value={fontSize}
                onChange={(e) => updateFontSize(Number(e.target.value))}
                className="flex-1 cursor-pointer h-1.5 min-w-0"
                style={{ accentColor: "#3b82f6" }}
              />
              <button
                onClick={() => updateFontSize(fontSize + 1)}
                disabled={fontSize >= FONT_SIZE_MAX}
                className={`flex items-center justify-center w-7 h-7 rounded-lg font-bold text-sm transition-all shrink-0 ${stepBtn}`}
              >
                +
              </button>
            </div>
           
          </div>

          <div
            className={`w-px self-stretch ${darkMode ? "bg-[#2a2a2e]" : "bg-gray-100"}`}
          />

          <button
            onClick={resetFontPrefs}
            className={`self-end mb-1 text-[18px] font-medium px-2.5 py-1.5 rounded-lg transition-all duration-150 shrink-0 ${resetBtn}`}
          >
            ↺
          </button>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  // BILL PREVIEW — thermal receipt
  // ══════════════════════════════════════════════════════════════════════
  const BillPreview = ({ showActions = true }) => (
    <div
      id="thermalBill"
      className="bg-white w-[320px] h-auto p-4 shadow-lg text-black inline-block"
      style={{ fontFamily: activeFontCss, fontSize: `${fontSize}px` }}
    >
      <div className="text-center">
        <h1 className="font-bold" style={{ fontSize: `${fontSize * 2}px` }}>
          {bill.title}
        </h1>
        <p className="font-bold">{bill.branch}</p>
        <p className="font-bold leading-5">{bill.franchise}</p>
        <p>{bill.address1}</p>
        <p>{bill.address2}</p>
        <p>{bill.city}</p>
        <p>Contact No: {bill.phone}</p>
        <p>Email: {bill.email}</p>
        <p>GST IN {bill.gst}</p>
        <p>{bill.date}</p>
        <p
          className="font-bold mt-1"
          style={{ fontSize: `${fontSize * 1.5}px` }}
        >
          {bill.dine}
        </p>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div className="text-center">
        <p className="font-bold" style={{ fontSize: `${fontSize * 1.5}px` }}>
          Bill No : {bill.billNo}
        </p>
        <p className="font-bold" style={{ fontSize: `${fontSize * 1.33}px` }}>
          Order Id: {bill.orderId}
        </p>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div
        className="flex justify-between font-bold"
        style={{ fontSize: `${fontSize * 1.25}px` }}
      >
        <span>Table: {bill.table}</span>
        <span>User : {bill.user}</span>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div>
        <div
          className="flex font-bold mb-2"
          style={{ fontSize: `${fontSize * 1.25}px` }}
        >
          <div className="w-[50%]">Item</div>
          <div className="w-[15%] text-center">Qty</div>
          <div className="w-[15%] text-center">Rate</div>
          <div className="w-[20%] text-right">Total</div>
        </div>
        {items.map((item, index) => (
          <div key={item.id} className="mb-1">
            <div className="flex">
              <div className="w-[50%]">
                {index + 1}. {item.name}
              </div>
              <div className="w-[15%] text-center">{item.qty}</div>
              <div className="w-[15%] text-center">{item.rate}</div>
              <div className="w-[20%] text-right">
                {(item.qty * item.rate).toFixed(1)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div style={{ fontSize: `${fontSize * 1.17}px` }}>
        <div className="flex justify-between">
          <div className="flex">
            <span className="font-bold">Total :</span>
            <span className="ml-26">{totalQty}</span>
          </div>
          <div>Rs {subtotal.toFixed(2)}</div>
        </div>
        <div className="flex justify-end mt-1">
          CGST (2.5%) : Rs {cgst.toFixed(2)}
        </div>
        <div className="flex justify-end mt-1">
          SGST (2.5%) : Rs {sgst.toFixed(2)}
        </div>
        <div className="text-right mt-5">
          <h1
            className="font-bold"
            style={{ fontSize: `${fontSize * 1.67}px` }}
          >
            Grand Total : Rs {grandTotal.toFixed(2)}
          </h1>
          <p className="mt-2">Rounded Amount : {roundedAmount}</p>
          <p className="italic mt-2 leading-6 capitalize">
            {convertAmountToWords(grandTotal)}
          </p>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div className="text-center">
        <p>E&amp;OE. Thank you. Visit Again.</p>
        <p className="mt-3">Powered by TMBill v7.4.80</p>
      </div>

      {showActions && (
        <div className="mt-4 flex flex-col gap-2 no-print">
          <button
            onClick={printAndSave}
            className="w-full bg-black text-white py-2 rounded text-lg font-bold"
          >
            🖨️ Print &amp; Save Bill
          </button>
          <button
            onClick={saveBill}
            className="w-full bg-green-600 text-white py-2 rounded text-lg font-bold"
          >
            💾 Save Only
          </button>
          {storageStatus && (
            <p className="text-center text-sm font-semibold mt-1">
              {storageStatus}
            </p>
          )}
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════
  // VIEW: SAVED BILLS LIST
  // ══════════════════════════════════════════════════════════════════════
  if (view === VIEW.LIST) {
    return (
      <div className={`min-h-screen ${pageBg} p-6`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold">📋 Saved Bills</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className={`px-3 py-2 rounded-lg font-semibold ${darkMode ? "bg-neutral-700 text-white" : "bg-gray-300 text-black"}`}
                aria-label="Toggle dark theme"
              >
                {darkMode ? "🌙" : "☀️"}
              </button>
              <button
                onClick={startNewBill}
                className="bg-black text-white px-5 py-2 rounded-lg text-lg font-semibold"
              >
                + New Bill
              </button>
            </div>
          </div>

          {loading && (
            <p className={`text-center py-10 ${mutedText}`}>
              Loading saved bills...
            </p>
          )}

          {!loading && savedBills.length === 0 && (
            <div
              className={`${cardBg} border ${cardBorder} rounded-lg shadow p-10 text-center ${mutedText}`}
            >
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-lg">Koi saved bill nahi mila.</p>
              <p className="text-sm mt-1">
                Upar "+ New Bill" dabake bill banayein.
              </p>
            </div>
          )}

          {savedBills.map((saved) => (
            <div
              key={saved.id}
              className={`${cardBg} border ${cardBorder} rounded-lg shadow p-4 mb-4 flex justify-between items-center`}
            >
              <div>
                <p className="font-bold text-lg">{saved.bill.billNo}</p>
                <p className={`text-sm ${mutedText}`}>{saved.bill.date}</p>
                <p className={`text-sm ${mutedText}`}>
                  {saved.bill.table} &nbsp;|&nbsp; {saved.bill.dine}
                </p>
                <p
                  className={`font-bold mt-1 ${darkMode ? "text-green-400" : "text-green-700"}`}
                >
                  ₹{saved.grandTotal}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => startEditBill(saved)}
                  className="bg-blue-600 text-white px-4 py-1 rounded font-semibold"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => {
                    startEditBill(saved);
                    setTimeout(() => setView(VIEW.PREVIEW), 50);
                  }}
                  className="bg-gray-700 text-white px-4 py-1 rounded font-semibold"
                >
                  👁️ View
                </button>
                <button
                  onClick={() => deleteSavedBill(saved.id)}
                  className="bg-red-500 text-white px-4 py-1 rounded font-semibold"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <style>{printStyle}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // VIEW: EDITOR
  // ══════════════════════════════════════════════════════════════════════
  if (view === VIEW.EDITOR) {
    const navBg = darkMode
      ? "bg-[#18181b] border-[#2a2a2e]"
      : "bg-white border-gray-200";
    const navBackBtn = darkMode
      ? "bg-[#27272a] hover:bg-[#333] text-neutral-300 border border-[#3a3a3f]"
      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200";
    const grandTotalBadge = darkMode
      ? "bg-[#1a2a1a] text-green-400 border border-green-900"
      : "bg-green-50 text-green-700 border border-green-200";

    return (
      <div className={`min-h-screen ${pageBg}`}>
        {/* ── Sticky top navbar ── */}
        <div
          className={`sticky top-0 z-30 border-b ${navBg} px-6 py-3 no-print`}
        >
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            {/* Back */}
            <button
              onClick={() => setView(VIEW.LIST)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${navBackBtn}`}
            >
              ← Back
            </button>

            {/* Title */}
            <h1 className="text-xl font-bold flex items-center gap-2 mr-auto">
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${darkMode ? "bg-blue-600 text-white" : "bg-blue-600 text-white"}`}
              >
                {editingId ? "EDIT" : "NEW"}
              </span>
              {editingId ? "Bill Edit Karein" : "Naya Bill"}
            </h1>

            {/* Grand Total badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold ${grandTotalBadge}`}
            >
              ₹{grandTotal.toFixed(0)}
            </div>

            {/* Save */}
            <button
              onClick={saveBill}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              💾 Save
            </button>

            {/* Preview & Print */}
            <button
              onClick={() => setView(VIEW.PREVIEW)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              🖨️ Preview & Print
            </button>
          </div>

          {/* Status message below nav */}
          {storageStatus && (
            <div className="max-w-7xl mx-auto mt-1">
              <p className="text-xs font-semibold text-green-500 pl-1">
                {storageStatus}
              </p>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Editor */}
            <div
              className={`${cardBg} border ${cardBorder} rounded-lg shadow p-5`}
            >
              <h2 className="text-2xl font-bold mb-5">Bill Details</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["title", "Restaurant Name", false],
                  ["branch", "Branch", false],
                  ["franchise", "Franchise", true],
                  ["address1", "Address Line 1", true],
                  ["address2", "Address Line 2", true],
                  ["city", "City", false],
                  ["phone", "Phone", false],
                  ["email", "Email", true],
                  ["gst", "GST Number", false],
                  ["date", "Date & Time", false],
                  ["dine", "Dine Type", false],
                  ["billNo", "Bill No", false],
                  ["orderId", "Order ID", true],
                  ["table", "Table", false],
                  ["user", "User", false],
                ].map(([field, placeholder, fullWidth]) => (
                  <input
                    key={field}
                    className={`border ${inputBg} p-2 rounded ${fullWidth ? "col-span-2" : ""}`}
                    value={bill[field]}
                    placeholder={placeholder}
                    onChange={(e) =>
                      setBill({ ...bill, [field]: e.target.value })
                    }
                  />
                ))}
              </div>

              <div className="mt-8">
                <div className="flex justify-between mb-4 items-center">
                  <h2 className="text-2xl font-bold">Items</h2>
                  <button
                    onClick={addItem}
                    className="bg-black text-white px-4 py-2 rounded"
                  >
                    + Add Item
                  </button>
                </div>
                <div
                  className={`grid grid-cols-12 gap-2 mb-2 text-xs font-bold px-1 ${mutedText}`}
                >
                  <div className="col-span-5">Item Name</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-center">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1" />
                </div>
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 mb-3">
                    <input
                      className={`border ${inputBg} p-2 rounded col-span-5`}
                      value={item.name}
                      placeholder="Item naam"
                      onChange={(e) =>
                        updateItem(index, "name", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      className={`border ${inputBg} p-2 rounded col-span-2`}
                      value={item.qty}
                      onChange={(e) => updateItem(index, "qty", e.target.value)}
                    />
                    <input
                      type="number"
                      className={`border ${inputBg} p-2 rounded col-span-2`}
                      value={item.rate}
                      onChange={(e) =>
                        updateItem(index, "rate", e.target.value)
                      }
                    />
                    <div
                      className={`border ${cardBorder} rounded p-2 col-span-2 text-right ${darkMode ? "bg-neutral-700" : "bg-gray-100"}`}
                    >
                      ₹{(item.qty * item.rate).toFixed(2)}
                    </div>
                    <button
                      onClick={() => deleteItem(index)}
                      className="bg-red-500 text-white rounded col-span-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div
                className={`mt-6 pt-4 border-t ${cardBorder} flex items-center gap-2 flex-wrap`}
              >
                <span className={`text-xs ${mutedText}`}>
                  Buttons upar navbar mein hain ↑
                </span>
              </div>
            </div>

            {/* Right: Display Settings → Live Preview label → Receipt */}
            <div>
              {/* ✅ Display Settings FIRST (upar) */}
              <FontControls />

              {/* ✅ "Live Preview" label SECOND (neeche, bill ke just upar) */}
              <p
                className={`text-center mb-3 font-semibold text-sm tracking-wide ${mutedText}`}
              >
                ── Live Preview ──
              </p>

              <div className="flex justify-center">
                <BillPreview showActions={false} />
              </div>
            </div>
          </div>
        </div>
        <style>{printStyle}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // VIEW: PREVIEW (for print)
  // ══════════════════════════════════════════════════════════════════════
  if (view === VIEW.PREVIEW) {
    return (
      <div className={`min-h-screen ${pageBg} p-6`}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-6 no-print">
            <button
              onClick={() => setView(VIEW.EDITOR)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              ← Editor par Wapas
            </button>
            <button
              onClick={() => setView(VIEW.LIST)}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold"
            >
              📋 Saved Bills
            </button>
          </div>

          {/* ✅ Display Settings FIRST (upar) */}
          <FontControls />

          {/* ✅ "Live Preview" label SECOND (neeche, bill ke just upar) */}
          <p
            className={`text-center mb-3 font-semibold text-sm tracking-wide ${mutedText}`}
          >
            ── Live Preview ──
          </p>

          <div className="flex justify-center">
            <BillPreview showActions={true} />
          </div>
        </div>
        <style>{printStyle}</style>
      </div>
    );
  }
}

const printStyle = `
  .no-print { display: flex; }

  @media print {
    body { background: white; }
    body * { visibility: hidden; }
    #thermalBill, #thermalBill * { visibility: visible; }
    .no-print { display: none !important; }

    #thermalBill {
      position: absolute;
      left: 0;
      top: 0;
      width: 300px;
      padding: 12px;
      margin: 0;
      box-sizing: border-box;
      overflow: hidden;
      background: linear-gradient(to bottom, #ffffff 0%, #fcfcfc 50%, #f8f8f8 100%);
      border: 1px solid #dcdcdc;
      border-radius: 5px;
      box-shadow: 0 0 4px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.12), 0 -2px 6px rgba(0,0,0,0.05);
    }

    button { display: none; }

    @page {
      size: 80mm 250mm;
      margin: 2mm;
    }
  }
`;
