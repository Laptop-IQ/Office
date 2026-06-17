import React, { useState, useEffect } from "react";
import { toWords } from "number-to-words";

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Format current date-time as "12 May 2026 03:20 PM" */
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

/**
 * Generate next Bill No in series.
 * Pattern: FR65/2627/NNNNNN  — increment by 35 each new bill.
 * lastSerial is stored in persistent storage as a plain number.
 */
const getNextBillNo = (lastSerial) => {
  const next = lastSerial + 35;
  return { billNo: `FR65/2627/${String(next).padStart(6, "0")}`, serial: next };
};

/** Generate a random Order ID like czh83eZ55qY0FK + 4 random alphanum chars */
const generateOrderId = () => {
  const prefix = "czh83eZ55qY0FK";
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + suffix;
};

/** Base restaurant details — stays constant across bills */
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

/** Build a fresh bill object — needs lastSerial from storage */
const buildNewBill = (lastSerial) => {
  const { billNo } = getNextBillNo(lastSerial);
  return {
    ...restaurantDefaults,
    date: getCurrentDateTime(),
    billNo,
    orderId: generateOrderId(),
  };
};

const defaultItems = [
  { id: 1, name: "Sagar Special Yellow Dal Tadka", qty: 1, rate: 250 },
  { id: 2, name: "Roti", qty: 5, rate: 30 },
  { id: 3, name: "Mineral Water", qty: 1, rate: 29.6 },
];

// ─── View Enum ─────────────────────────────────────────────────────────────
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

  // ── Load saved bills + lastSerial from persistent storage on mount ──────
 useEffect(() => {
   try {
     const bills = localStorage.getItem("thermalBills");
     const serial = localStorage.getItem("lastBillSerial");

     if (serial) {
       setLastSerial(parseInt(serial, 10));
     }

     if (bills) {
       setSavedBills(JSON.parse(bills));
     }
   } catch (err) {
     console.error(err);
   } finally {
     setLoading(false);
   }
 }, []);

  // ── Persist bills + serial to storage ─────────────────────────────────
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

  // ── Calculations ────────────────────────────────────────────────────────
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

  // ── Item helpers ────────────────────────────────────────────────────────
  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === "name" ? value : Number(value);
    setItems(updated);
  };

  const addItem = () =>
    setItems([...items, { id: Date.now(), name: "", qty: 1, rate: 0 }]);

  const deleteItem = (index) => setItems(items.filter((_, i) => i !== index));

  // ── New Bill — auto-generate billNo, orderId, date ────────────────────
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

  // ── Edit existing bill ─────────────────────────────────────────────────
  const startEditBill = (saved) => {
    setEditingId(saved.id);
    setBill(saved.bill);
    setItems(saved.items);
    setStorageStatus("");
    setView(VIEW.EDITOR);
  };

  // ── Save bill (new or update) ──────────────────────────────────────────
  const saveBill = async () => {
    let updatedBills;
    let serialToSave = lastSerial;

    if (editingId !== null) {
      // Update existing entry — serial unchanged
      updatedBills = savedBills.map((b) =>
        b.id === editingId ? { ...b, bill, items, grandTotal } : b,
      );
    } else {
      // New entry — serial was already incremented in startNewBill, persist it
      const newEntry = { id: Date.now(), bill, items, grandTotal };
      updatedBills = [...savedBills, newEntry];
      setEditingId(newEntry.id);
    }

    const ok = await persistBills(updatedBills, serialToSave);
    if (ok) {
      setSavedBills(updatedBills);
      setStorageStatus("✅ Bill saved successfully!");
      setTimeout(() => setStorageStatus(""), 3000);
    }
  };

  // ── Print & Save ───────────────────────────────────────────────────────
  const printAndSave = async () => {
    await saveBill();
    window.print();
  };

  // ── Delete bill ────────────────────────────────────────────────────────
  const deleteSavedBill = async (id) => {
    if (!window.confirm("Kya aap yeh bill delete karna chahte hain?")) return;
    const updated = savedBills.filter((b) => b.id !== id);
    const ok = await persistBills(updated, lastSerial);
    if (ok) setSavedBills(updated);
  };

  // ════════════════════════════════════════════════════════════════════════
  // ── BILL PREVIEW (thermal receipt) ────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════
  const BillPreview = ({ showActions = true }) => (
    <div
      id="thermalBill"
      className="bg-white w-[320px] h-auto p-4 shadow-lg font-mono text-[12px] text-black inline-block"
    >
      <div className="text-center">
        <h1 className="text-[24px] font-bold">{bill.title}</h1>
        <p className="font-bold">{bill.branch}</p>
        <p className="font-bold leading-5">{bill.franchise}</p>
        <p>{bill.address1}</p>
        <p>{bill.address2}</p>
        <p>{bill.city}</p>
        <p>Contact No: {bill.phone}</p>
        <p>Email: {bill.email}</p>
        <p>GST IN {bill.gst}</p>
        <p>{bill.date}</p>
        <p className="font-bold text-[18px] mt-1">{bill.dine}</p>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div className="text-center">
        <p className="font-bold text-[18px]">Bill No : {bill.billNo}</p>
        <p className="font-bold text-[16px]">Order Id: {bill.orderId}</p>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div className="flex justify-between font-bold text-[15px]">
        <span>Table: {bill.table}</span>
        <span>User : {bill.user}</span>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div>
        <div className="flex font-bold text-[15px] mb-2">
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

      <div className="text-[14px]">
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
          <h1 className="text-[20px] font-bold">
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
        <p>E&OE. Thank you. Visit Again.</p>
        <p className="mt-3">Powered by TMBill v7.4.80</p>
      </div>

      {showActions && (
        <div className="mt-4 flex flex-col gap-2 no-print">
          <button
            onClick={printAndSave}
            className="w-full bg-black text-white py-2 rounded text-lg font-bold"
          >
            🖨️ Print & Save Bill
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

  // ════════════════════════════════════════════════════════════════════════
  // ── VIEW: SAVED BILLS LIST ─────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════
  if (view === VIEW.LIST) {
    return (
      <div className="min-h-screen bg-gray-200 p-6 text-black">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold">📋 Saved Bills</h1>
            <button
              onClick={startNewBill}
              className="bg-black text-white px-5 py-2 rounded-lg text-lg font-semibold"
            >
              + New Bill
            </button>
          </div>

          {loading && (
            <p className="text-gray-500 text-center py-10">
              Loading saved bills...
            </p>
          )}

          {!loading && savedBills.length === 0 && (
            <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
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
              className="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-lg">{saved.bill.billNo}</p>
                <p className="text-sm text-gray-600">{saved.bill.date}</p>
                <p className="text-sm text-gray-600">
                  {saved.bill.table} &nbsp;|&nbsp; {saved.bill.dine}
                </p>
                <p className="text-green-700 font-bold mt-1">
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

  // ════════════════════════════════════════════════════════════════════════
  // ── VIEW: EDITOR ───────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════
  if (view === VIEW.EDITOR) {
    return (
      <div className="min-h-screen bg-gray-200 p-6 text-black">
        <div className="max-w-7xl mx-auto">
          {/* Top nav */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setView(VIEW.LIST)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold">
              {editingId ? "✏️ Bill Edit Karein" : "🆕 Naya Bill"}
            </h1>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* ── Left: Editor ────────────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow p-5">
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
                    className={`border p-2 rounded ${fullWidth ? "col-span-2" : ""}`}
                    value={bill[field]}
                    placeholder={placeholder}
                    onChange={(e) =>
                      setBill({ ...bill, [field]: e.target.value })
                    }
                  />
                ))}
              </div>

              {/* Items */}
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

                <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-bold text-gray-500 px-1">
                  <div className="col-span-5">Item Name</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-center">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1" />
                </div>

                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 mb-3">
                    <input
                      className="border p-2 rounded col-span-5"
                      value={item.name}
                      placeholder="Item naam"
                      onChange={(e) =>
                        updateItem(index, "name", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      className="border p-2 rounded col-span-2"
                      value={item.qty}
                      onChange={(e) => updateItem(index, "qty", e.target.value)}
                    />
                    <input
                      type="number"
                      className="border p-2 rounded col-span-2"
                      value={item.rate}
                      onChange={(e) =>
                        updateItem(index, "rate", e.target.value)
                      }
                    />
                    <div className="border rounded p-2 bg-gray-100 col-span-2 text-right">
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

              {/* Bottom actions */}
              <div className="mt-6 flex gap-3 flex-wrap">
                <button
                  onClick={saveBill}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold"
                >
                  💾 Save Bill
                </button>
                <button
                  onClick={() => setView(VIEW.PREVIEW)}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold"
                >
                  👁️ Preview & Print
                </button>
                <button
                  onClick={() => setView(VIEW.LIST)}
                  className="bg-gray-500 text-white px-5 py-2 rounded-lg font-bold"
                >
                  ← Back to List
                </button>
              </div>

              {storageStatus && (
                <p className="mt-3 text-sm font-semibold">{storageStatus}</p>
              )}
            </div>

            {/* ── Right: Live Preview ──────────────────────────────────── */}
            <div className="flex justify-center">
              <div>
                <p className="text-center text-gray-600 mb-3 font-semibold">
                  Live Preview
                </p>
                <BillPreview showActions={false} />
              </div>
            </div>
          </div>
        </div>

        <style>{printStyle}</style>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // ── VIEW: PREVIEW (for print) ─────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════
  if (view === VIEW.PREVIEW) {
    return (
      <div className="min-h-screen bg-gray-200 p-6 text-black">
        <div className="max-w-md mx-auto">
          {/* Top nav */}
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

          <div className="flex justify-center">
            <BillPreview showActions={true} />
          </div>
        </div>

        <style>{printStyle}</style>
      </div>
    );
  }
}

// ── Print CSS ──────────────────────────────────────────────────────────────
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
      background-image: repeating-linear-gradient(
        to bottom,
        rgba(0,0,0,0.015) 0px,
        rgba(0,0,0,0.015) 1px,
        transparent 1px,
        transparent 1px
      );
    }

    button { display: none; }

    @page {
      size: 80mm 250mm;
      margin: 2mm;
    }
  }
`;
