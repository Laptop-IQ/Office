// utils/demoSeed.js
// Sample data for the guest demo. Dates are relative to "today", so the demo
// never looks stale (the template is re-seeded every DEMO_RESEED_DAYS days).
// All names, numbers and prices below are made up.
import Customer from "../models/Customer.js";
import Record from "../models/Record.js";
import StockWorkspace from "../models/stockModel.js";
import OverdueEntry from "../models/overdueModel.js";
import PaymentHistory from "../models/paymentHistoryModel.js";
import PriceListWorkspace from "../models/priceListModel.js";
import EcofastEntry from "../models/EcofastEntry.js";

const iso = (daysAgo = 0) => {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const nowIso = () => new Date().toISOString();

export async function seedDemoData(userId) {
  /* ── DSR customers + visit records ───────────────────────────────────── */
  const customers = [
    ["Sai Nath Textiles", "Ahmedabad", "Supple", "B - Trial", 120, 40, 80, 25, 150, "9876543210", "Ramesh Patel"],
    ["Om Denim Mills", "Surat", "Shree Jee Traders", "A - Introduced", 90, 30, 0, 0, 100, "9812345678", "Mahesh Shah"],
    ["Krishna Fabrics", "Ahmedabad", "Supple", "C - Order", 200, 60, 150, 45, 220, "9898989898", "Kiran Mehta"],
    ["Balaji Washing", "Vapi", "Shree Jee Traders", "B - Trial", 70, 20, 35, 10, 60, "9723456789", "Suresh Desai"],
    ["Ganesh Processors", "Surat", "Supple", "A - Introduced", 110, 35, 0, 0, 90, "9909090909", "Jignesh Modi"],
    ["Shree Laxmi Dyeing", "Vapi", "Supple", "C - Order", 160, 50, 120, 40, 180, "9811122233", "Dinesh Joshi"],
  ];
  await Customer.insertMany(
    customers.map(([name, area, distributor, stage, potDyes, potAux, exDyes, exAux, abp, mobile, contactPerson]) => ({
      user: userId, name, area, distributor, stage, potDyes, potAux, exDyes, exAux, abp, mobile, contactPerson,
    })),
  );

  const visits = [
    [1, "Sai Nath Textiles", "Ahmedabad", "Supple", "Trial of Ecofast Blue BR", "B - Trial", "Trial success, awaiting approval", 95, 120],
    [2, "Om Denim Mills", "Surat", "Shree Jee Traders", "Product introduction", "A - Introduced", "Sample requested", 0, 100],
    [3, "Krishna Fabrics", "Ahmedabad", "Supple", "Order follow-up", "C - Order", "Order of 250 kg confirmed", 180, 220],
    [4, "Balaji Washing", "Vapi", "Shree Jee Traders", "Shade matching", "B - Trial", "Shade matched, price discussion", 25, 60],
    [6, "Shree Laxmi Dyeing", "Vapi", "Supple", "Payment follow-up", "C - Order", "Payment promised in 3 days", 140, 180],
    [8, "Ganesh Processors", "Surat", "Supple", "Competitor comparison", "A - Introduced", "Will test Ecosol Black", 0, 90],
  ];
  for (const [ago, customer, area, distributor, objective, stage, outcome, ytd, abp] of visits) {
    await Record.create({
      user: userId, date: iso(ago), area, distributor, customer, objective, stage, outcome,
      potDyes: 100, potAux: 30, exDyes: 60, exAux: 20, abp, ytd,
    });
  }

  /* ── Stock manager + dispatch ────────────────────────────────────────── */
  const p = (id, name, qty, minQty, category, extra = {}) => ({
    id, name, qty, minQty, unit: "kg", category, batch: `B${2400 + id}`, expiry: "", supplier: "Ecofast Chemicals", reorderNote: "", ...extra,
  });
  const stocks = {
    godown: [
      p(1001, "ECOFAST BLUE BR", 220, 100, "ECOFAST"),
      p(1002, "ECOFAST BLUE B", 85, 100, "ECOFAST"),
      p(1003, "ECOFAST BLACK B", 140, 80, "ECOFAST"),
      p(1004, "ECOSOL BLACK Q2ELW", 60, 50, "ECOSOL"),
      p(1005, "DENIMOZ OXIDANT", 300, 120, "DENIMOZ"),
      p(1006, "SULFAID SODIUM SULPHIDE", 25, 60, "SULFAID"),
    ],
    shop: [
      p(2001, "SAFEAUX SQUANDET FBN", 45, 20, "SAFEAUX"),
      p(2002, "SAFEAUX PREP LF", 12, 25, "SAFEAUX"),
      p(2003, "ECOPLUS RED", 70, 30, "ECOPLUS"),
    ],
  };
  await StockWorkspace.create({
    owner: userId,
    companyName: "Demo Chemical Store",
    locations: [
      { id: "godown", name: "Main Godown", icon: "🏭" },
      { id: "shop", name: "Shop", icon: "🏪" },
    ],
    stocks,
    lastUpdated: { godown: nowIso(), shop: nowIso() },
    changeLog: [
      { id: 1, action: "ADD", tab: "godown", details: "Added ECOFAST BLUE BR (220 kg)", time: nowIso() },
      { id: 2, action: "DISPATCH", tab: "godown", details: "Dispatched to Sai Nath Textiles", time: nowIso() },
    ],
    dispatches: [
      {
        id: 5001, customerName: "Sai Nath Textiles", location: "godown", locationName: "Main Godown",
        items: [{ productId: 1001, productName: "ECOFAST BLUE BR", shade: "", qtyDispatched: 20, unit: "kg", prevQty: 240, newQty: 220 }],
        note: "Trial lot", date: iso(2), time: "11:30", totalQty: 20, invoiceNo: "INV-1001",
      },
      {
        id: 5002, customerName: "Krishna Fabrics", location: "godown", locationName: "Main Godown",
        items: [{ productId: 1003, productName: "ECOFAST BLACK B", shade: "", qtyDispatched: 30, unit: "kg", prevQty: 170, newQty: 140 }],
        note: "", date: iso(5), time: "16:10", totalQty: 30, invoiceNo: "INV-1002",
      },
    ],
  });

  /* ── Price list ──────────────────────────────────────────────────────── */
  const prices = [
    ["ECOFAST BLUE BR", "ECOFAST", 410, 395, 450],
    ["ECOFAST BLUE B", "ECOFAST", 395, 380, 435],
    ["ECOFAST BLACK B", "ECOFAST", 360, 345, 400],
    ["ECOSOL BLACK Q2ELW", "ECOSOL", 520, 500, 575],
    ["ECOPLUS RED", "ECOPLUS", 480, 460, 530],
    ["SAFEAUX SQUANDET FBN", "SAFEAUX", 210, 200, 235],
    ["SAFEAUX PREP LF", "SAFEAUX", 185, 175, 205],
    ["DENIMOZ OXIDANT", "DENIMOZ", 150, 142, 170],
    ["SULFAID SODIUM SULPHIDE", "SULFAID", 62, 58, 70],
  ];
  await PriceListWorkspace.create({
    owner: userId,
    fileName: "demo-price-list.xlsx",
    products: prices.map(([name, category, dp7, dp45, rsp], i) => ({
      sr: i + 1, code: `P${100 + i}`, name, category, dp7, dp45, rsp,
    })),
  });

  /* ── Overdue payments (+ one payment already received) ───────────────── */
  const bills = [
    ["Rakesh", "Sai Nath Textiles", 75, "Sale", "INV/24/101", 84000, 84000],
    ["Rakesh", "Sai Nath Textiles", 40, "Sale", "INV/24/118", 56500, 56500],
    ["Rakesh", "Om Denim Mills", 62, "Sale", "INV/24/109", 128000, 128000],
    ["Amit", "Krishna Fabrics", 30, "Sale", "INV/24/131", 45200, 45200],
    ["Amit", "Krishna Fabrics", 95, "Sale", "INV/24/090", 91000, 61000],
    ["Amit", "Balaji Washing", 18, "Sale", "INV/24/140", 33800, 33800],
    ["Rakesh", "Shree Laxmi Dyeing", 120, "Sale", "INV/24/072", 152000, 152000],
    ["Rakesh", "Ganesh Processors", 55, "Sale", "INV/24/112", 67300, 67300],
  ];
  const entries = await OverdueEntry.insertMany(
    bills.map(([salesman, account, ago, type, refNo, refAmt, pendingAmt]) => ({
      user: userId, salesman, account, dated: iso(ago), type, refNo, refAmt, pendingAmt,
      due: "30 Days", dueDate: iso(ago - 30), isPendingModified: pendingAmt !== refAmt, fileName: "demo-overdues.xlsx",
    })),
  );
  const paid = entries.find((e) => e.refNo === "INV/24/090");
  await PaymentHistory.create({
    user: userId, account: "Krishna Fabrics", amountReceived: 30000, allocatedAmount: 30000, unallocatedAmount: 0,
    source: "single-bill",
    allocations: [{ entryId: paid._id, refNo: paid.refNo, dated: paid.dated, amount: 30000, pendingBefore: 91000, pendingAfter: 61000 }],
  });

  /* ── Ecofast / Ecosol trial reports ──────────────────────────────────── */
  const step = (no, details, dosage = "", totalQty = "", ph = "", temp = "", time = "") => ({ no, details, dosage, totalQty, ph, temp, time, costPerKg: "", cost: "" });
  const common = {
    visitedBy: "SK", objective: "To Achieve the result with our Product and get the order from the Customer",
    reason: "Promotion", quality: "Jeans", machinery: "Belly Washer", mlr: "1:12",
    processFollowed: "Process Followed as per annexure 1 to 2",
  };
  await EcofastEntry.create([
    {
      user: userId,
      report: { ...common, date: iso(3), customer: "Sai Nath Textiles", dmuMet: "Ramesh Patel", qualityType: "Cotton", trialDetails: "", observations: "Good depth and even shade.", conclusion: "Trial Success", product: "BLUE BR", action: "Send sample for approval" },
      process: {
        quality: "Garment", qualityType: "Cotton", raw: "RAW ( RFD)", quantity: "6 kg", standardSolution: "3%", standardValue: "180 gm",
        machine: "Belly Washer", liquorQuantity: "60 L", sample: "", method: "Method: Exhaust Dyeing", speed: "16",
        steps: [
          step("1", "FBN", "1 gpl", "60 gm", "12.5", "60 C", "10 min"), step("", "CAUSTIC SODA", "1 gpl", "60 gm"),
          step("2", "DYE ADDITION", "3 %", "180 gm", "", "", "10 min"), step("", "SALT ADDITION ( COMMON SALT )", "20 gpl", "1200 gm", "", "", "10 min"),
          step("", "RUN", "", "", "", "60 C", "45 min"), step("3", "DRAIN"), step("", "FINISH"),
        ],
      },
    },
    {
      user: userId,
      report: { ...common, date: iso(6), customer: "Om Denim Mills", dmuMet: "Mahesh Shah", qualityType: "PC", trialDetails: "RFD Garment", observations: "Shade slightly lighter, increase dye by 0.5%.", conclusion: "Pending", product: "ECOSOL BLACK Q2ELW", action: "Repeat trial with higher dosage" },
      process: {
        quality: "Garment", qualityType: "Cotton", raw: "RFD Garment", quantity: "8 kg", standardSolution: "4 gpl", standardValue: "240 gm",
        machine: "Belly Washer", liquorQuantity: "60 L", sample: "", method: "Method: Exhaust Dyeing", speed: "16",
        steps: [
          step("1", "Squandet FBN", "1 gpl", "60 gm", "12.5", "55 C", "10 min"), step("", "Prep LF", "1 gpl", "60 gm"),
          step("2", "DYE ADDITION", "4 gpl", "240 gm", "", "55 C", "10 min"), step("", "RUN", "", "", "", "60 C", "45 min"),
          step("3", "DRAIN"), step("", "FINISH"),
        ],
      },
    },
  ]);
}
