import { useState } from "react";

const FONT = "'Courier New', Courier, monospace";

const DEFAULT_BILL = {
  name: "GOLDEN HUT",
  addr1: "G.T ROAD RAI SONEPAT",
  addr2: "(DELHI TO AMBALA)",
  gstin: "06ABFFR7045A1ZH",
  phone: "9992430999",
  billNo: "B000147",
  time: "15:04",
  date: "05/06/26",
  table: "52",
  pax: "1",
  user: "happy",
  cgst: 2.5,
  sgst: 2.5,
  paid: 0,
  orderNo: "G000294\\G000306\\G000324\\G00032",
};

const DEFAULT_ITEMS = [
  { id: 1, qty: 1, desc: "LACHHA PARANTHA", price: 99 },
  { id: 2, qty: 2, desc: "PLAIN ROTI", price: 78 },
  { id: 3, qty: 1, desc: "KADHAI PANEER", price: 379 },
  { id: 4, qty: 1, desc: "HARA BHARA KEBAB", price: 359 },
  { id: 5, qty: 1, desc: "GARLIC NAAN", price: 119 },
  { id: 6, qty: 1, desc: "ADRAK CHAI", price: 40 },
  { id: 7, qty: 2, desc: "LEMON SODA", price: 198 },
  { id: 8, qty: 1, desc: "MINERAL WATER", price: 30 },
];

let uid = 1000;

function Field({ value, onChange, type = "text", style = {}, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) =>
        onChange(
          type === "number" ? parseFloat(e.target.value) || 0 : e.target.value,
        )
      }
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        fontFamily: FONT,
        fontSize: "inherit",
        color: "#000",
        fontWeight: "inherit",
        letterSpacing: "inherit",
        border: "none",
        outline: "none",
        padding: "1px 3px",
        borderRadius: "2px",
        boxSizing: "border-box",
        background: focused ? "rgba(59,130,246,0.11)" : "transparent",
        transition: "background 0.12s",
        ...style,
      }}
      {...rest}
    />
  );
}

function Hr({ dashed }) {
  return (
    <div
      style={{
        borderTop: dashed ? "1px dashed #999" : "1.5px solid #1a1a1a",
        margin: "8px 0",
      }}
    />
  );
}

function TotalRow({ label, value, bold }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "2px 0",
        fontSize: bold ? "14px" : "13px",
        fontWeight: bold ? "bold" : "normal",
        color: "#000",
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function FoodBill() {
  const [bill, setBill] = useState({ ...DEFAULT_BILL });
  const [items, setItems] = useState(DEFAULT_ITEMS.map((i) => ({ ...i })));

  const set = (k, v) => setBill((prev) => ({ ...prev, [k]: v }));
  const setItem = (id, k, v) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [k]: v } : it)),
    );
  const removeItem = (id) =>
    setItems((prev) => prev.filter((it) => it.id !== id));
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: uid++, qty: 1, desc: "NEW ITEM", price: 0 },
    ]);
  const reset = () => {
    setBill({ ...DEFAULT_BILL });
    setItems(DEFAULT_ITEMS.map((i) => ({ ...i })));
  };

  const subTotal = items.reduce((s, it) => s + (it.price || 0), 0);
  const cgstAmt = parseFloat(((subTotal * bill.cgst) / 100).toFixed(2));
  const sgstAmt = parseFloat(((subTotal * bill.sgst) / 100).toFixed(2));
  const payable = Math.round(subTotal + cgstAmt + sgstAmt);
  const balance = payable - (bill.paid || 0);

  return (
    <div
      style={{
        fontFamily: FONT,
        minHeight: "100vh",
        background: "#ccc5b5",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; }
          input { background: transparent !important; }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        input { color: #000 !important; }
        * { -webkit-text-fill-color: #000; }
        input:focus, input:hover { -webkit-text-fill-color: #000; }
      `}</style>

      {/* ── Toolbar ── */}
      <div
        className="no-print"
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "18px",
          width: "100%",
          maxWidth: "520px",
        }}
      >
        {[
          ["🖨 Print", () => window.print()],
          ["＋ Add Item", addItem],
          ["↺ Reset", reset],
        ].map(([label, fn]) => (
          <button
            key={label}
            onClick={fn}
            style={{
              fontFamily: FONT,
              fontSize: "13px",
              padding: "8px 0",
              cursor: "pointer",
              border: "1.5px solid #444",
              background: "#fdfaf4",
              color: "#000",
              flex: 1,
              borderRadius: "2px",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#f0e8d4")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#fdfaf4")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Receipt Paper ── */}
      <div
        style={{
          background: "#fffef8",
          color: "#000",
          width: "100%",
          maxWidth: "520px",
          padding: "26px 30px 34px",
          boxShadow:
            "0 2px 0 #b8ae96, 0 4px 0 #a89e86, 0 6px 20px rgba(0,0,0,0.28)",
        }}
      >
        {/* ── Restaurant Header ── */}
        <div
          style={{ textAlign: "center", marginBottom: "14px", color: "#000" }}
        >
          <Field
            value={bill.name}
            onChange={(v) => set("name", v)}
            style={{
              width: "100%",
              textAlign: "center",
              fontSize: "20px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
            }}
          />
          <Field
            value={bill.addr1}
            onChange={(v) => set("addr1", v)}
            style={{ width: "100%", textAlign: "center", fontSize: "12.5px" }}
          />
          <Field
            value={bill.addr2}
            onChange={(v) => set("addr2", v)}
            style={{ width: "100%", textAlign: "center", fontSize: "12.5px" }}
          />
          <div style={{ fontSize: "12.5px", marginTop: "3px" }}>
            GSTIN:{" "}
            <Field
              value={bill.gstin}
              onChange={(v) => set("gstin", v)}
              style={{ fontSize: "12.5px" }}
            />
          </div>
          <div style={{ fontSize: "12.5px" }}>
            PH:{" "}
            <Field
              value={bill.phone}
              onChange={(v) => set("phone", v)}
              style={{ fontSize: "12.5px" }}
            />
          </div>
        </div>

        <Hr />

        {/* ── Bill Meta ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12.5px",
            marginBottom: "3px",
            color: "#000",
          }}
        >
          <span>
            Bill No :{" "}
            <Field
              value={bill.billNo}
              onChange={(v) => set("billNo", v)}
              style={{ fontSize: "12.5px", width: "82px" }}
            />
          </span>
          <span>
            Time :
            <Field
              value={bill.time}
              onChange={(v) => set("time", v)}
              style={{ fontSize: "12.5px", width: "52px" }}
            />
          </span>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12.5px",
            marginBottom: "8px",
          }}
        >
          <thead>
            <tr style={{ color: "#000" }}>
              {["Date", "Table", "Pax", "User"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontWeight: "normal",
                    paddingRight: "16px",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Field
                  value={bill.date}
                  onChange={(v) => set("date", v)}
                  style={{ width: "64px" }}
                />
              </td>
              <td>
                <Field
                  value={bill.table}
                  onChange={(v) => set("table", v)}
                  style={{ width: "30px", textAlign: "center" }}
                />
              </td>
              <td>
                <Field
                  value={bill.pax}
                  onChange={(v) => set("pax", v)}
                  style={{ width: "22px", textAlign: "center" }}
                />
              </td>
              <td>
                <Field
                  value={bill.user}
                  onChange={(v) => set("user", v)}
                  style={{ width: "80px" }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <Hr />

        {/* ── Items Table ── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            color: "#000",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #333" }}>
              <th
                style={{
                  textAlign: "left",
                  fontWeight: "bold",
                  paddingBottom: "5px",
                  width: "36px",
                }}
              >
                Qty
              </th>
              <th
                style={{
                  textAlign: "left",
                  fontWeight: "bold",
                  paddingBottom: "5px",
                }}
              >
                Description
              </th>
              <th
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  paddingBottom: "5px",
                  width: "72px",
                }}
              >
                Price
              </th>
              <th className="no-print" style={{ width: "22px" }} />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td style={{ paddingTop: "3px" }}>
                  <Field
                    type="number"
                    min="0"
                    step="1"
                    value={it.qty}
                    onChange={(v) =>
                      setItem(it.id, "qty", Math.max(0, Math.round(v)))
                    }
                    style={{ width: "32px", textAlign: "center" }}
                  />
                </td>
                <td style={{ paddingTop: "3px" }}>
                  <Field
                    value={it.desc}
                    onChange={(v) => setItem(it.id, "desc", v.toUpperCase())}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ paddingTop: "3px", textAlign: "right" }}>
                  <Field
                    type="number"
                    min="0"
                    step="1"
                    value={it.price}
                    onChange={(v) =>
                      setItem(it.id, "price", parseFloat(v) || 0)
                    }
                    style={{ width: "68px", textAlign: "right" }}
                  />
                </td>
                <td className="no-print" style={{ paddingTop: "3px" }}>
                  <button
                    onClick={() => removeItem(it.id)}
                    title="Remove"
                    style={{
                      border: "none",
                      background: "none",
                      color: "#cc2200",
                      cursor: "pointer",
                      fontSize: "17px",
                      lineHeight: 1,
                      padding: "0 0 0 4px",
                      opacity: 0.6,
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = 0.6)}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          className="no-print"
          onClick={addItem}
          style={{
            width: "100%",
            marginTop: "7px",
            border: "1px dashed #bbb",
            background: "transparent",
            color: "#bbb",
            fontFamily: FONT,
            fontSize: "12px",
            padding: "4px",
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "#666";
            e.currentTarget.style.borderColor = "#888";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "#bbb";
            e.currentTarget.style.borderColor = "#bbb";
          }}
        >
          + Add Item
        </button>

        <Hr dashed />

        {/* ── Totals ── */}
        <TotalRow label="Sub Total" value={subTotal.toFixed(2)} />
        <TotalRow
          label={
            <span>
              CGST{" "}
              <Field
                type="number"
                min="0"
                max="99"
                step="0.5"
                value={bill.cgst}
                onChange={(v) => set("cgst", parseFloat(v) || 0)}
                style={{ width: "34px", fontSize: "13px" }}
              />
              %
            </span>
          }
          value={cgstAmt.toFixed(2)}
        />
        <TotalRow
          label={
            <span>
              SGST{" "}
              <Field
                type="number"
                min="0"
                max="99"
                step="0.5"
                value={bill.sgst}
                onChange={(v) => set("sgst", parseFloat(v) || 0)}
                style={{ width: "34px", fontSize: "13px" }}
              />
              %
            </span>
          }
          value={sgstAmt.toFixed(2)}
        />

        <Hr />

        <TotalRow bold label="Payable in" value={`? ${payable.toFixed(2)}`} />
        <TotalRow
          label="Paid Amount"
          value={
            <Field
              type="number"
              min="0"
              step="1"
              value={bill.paid}
              onChange={(v) => set("paid", parseFloat(v) || 0)}
              style={{ width: "80px", textAlign: "right", fontSize: "13px" }}
            />
          }
        />
        <TotalRow bold label="Balance Amount" value={balance.toFixed(2)} />

        <Hr dashed />

        <div
          style={{
            fontSize: "11.5px",
            wordBreak: "break-all",
            marginTop: "4px",
            color: "#000",
          }}
        >
          Order No:{" "}
          <Field
            value={bill.orderNo}
            onChange={(v) => set("orderNo", v)}
            style={{
              fontSize: "11px",
              width: "calc(100% - 78px)",
              color: "#000",
            }}
          />
        </div>

        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            marginTop: "12px",
            letterSpacing: "1px",
            fontSize: "13px",
            color: "#000",
          }}
        >
          ===THANKS &amp; VISIT AGAIN====
        </div>
      </div>

      <p
        className="no-print"
        style={{
          color: "#999",
          fontSize: "11px",
          marginTop: "12px",
          textAlign: "center",
          letterSpacing: "0.4px",
        }}
      >
        Click any field to edit &nbsp;·&nbsp; Totals auto-calculate
        &nbsp;·&nbsp; 🖨 Print hides edit controls
      </p>
    </div>
  );
}
