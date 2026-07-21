import Customer from "../models/customerListModel.js";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const followUpStatus = (customer) => {
  if (customer.isFollowUpDone) return "completed";
  if (customer.followUpCancelled) return "cancelled";
  if (!customer.nextFollowUpDate) return "upcoming";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(customer.nextFollowUpDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return "upcoming";
};

const withComputed = (customer) => {
  const obj = customer.toObject ? customer.toObject() : customer;
  return { ...obj, followUpStatus: followUpStatus(obj) };
};

/* ─────────────────────────────────────────────────────
   CREATE
───────────────────────────────────────────────────── */
export const createCustomer = async (req, res) => {
  try {
    const {
      company,
      name,
      phone,
      email,
      gst,
      pan,
      city,
      state,
      type,
      category,
      status,
      badges,
      salesPerson,
      creditLimit,
      outstanding,
      nextFollowUpDate,
    } = req.body;

    if (!company || !name || !phone || !city || !state || !type || !category)
      return res
        .status(400)
        .json({ success: false, message: "Required fields missing" });

    const customer = await Customer.create({
      company,
      name,
      phone,
      email,
      gst,
      pan,
      city,
      state,
      type,
      category,
      status,
      badges,
      salesPerson,
      creditLimit,
      outstanding,
      nextFollowUpDate,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: withComputed(customer),
    });
  } catch (err) {
    console.error("createCustomer error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────
   LIST  (search · filter · sort · paginate)
───────────────────────────────────────────────────── */
export const getCustomers = async (req, res) => {
  try {
    const {
      search,
      type,
      status,
      category,
      state,
      salesPerson,
      followUpStatus: fu,
      sortBy = "company",
      sortDir = "asc",
      page = 1,
      limit = 8,
    } = req.query;

    const query = {};

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      query.$or = [
        { company: regex },
        { name: regex },
        { phone: regex },
        { email: regex },
        { gst: regex },
        { pan: regex },
        { city: regex },
      ];
    }
    if (type && type !== "All") query.type = type;
    if (status && status !== "All") query.status = status;
    if (category && category !== "All") query.category = category;
    if (state && state !== "All") query.state = state;
    if (salesPerson && salesPerson !== "All") query.salesPerson = salesPerson;

    const allowedSortKeys = [
      "company",
      "name",
      "type",
      "city",
      "outstanding",
      "creditLimit",
      "lastOrderDate",
      "status",
      "customerId",
    ];
    const safeSortBy = allowedSortKeys.includes(sortBy) ? sortBy : "company";
    const sortOptions = { [safeSortBy]: sortDir === "asc" ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    let customers = await Customer.find(query)
      .populate("salesPerson", "name email")
      .sort(sortOptions)
      .lean();

    // Compute follow-up status in JS (needs date logic)
    customers = customers.map((c) => ({
      ...c,
      followUpStatus: followUpStatus(c),
    }));

    // Filter by follow-up status AFTER computing it
    if (fu && fu !== "All")
      customers = customers.filter((c) => c.followUpStatus === fu);

    const total = customers.length;
    const paginated = customers.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
      customers: paginated,
    });
  } catch (err) {
    console.error("getCustomers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────
   SINGLE
───────────────────────────────────────────────────── */
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate(
      "salesPerson",
      "name email",
    );

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    res.json({ success: true, customer: withComputed(customer) });
  } catch (err) {
    console.error("getCustomerById error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────
   UPDATE
───────────────────────────────────────────────────── */
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    const allowedFields = [
      "company",
      "name",
      "phone",
      "email",
      "gst",
      "pan",
      "city",
      "state",
      "type",
      "category",
      "status",
      "badges",
      "salesPerson",
      "creditLimit",
      "outstanding",
      "lastOrderDate",
      "nextFollowUpDate",
      "isFollowUpDone",
      "followUpCancelled",
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) customer[field] = req.body[field];
    });

    await customer.save();
    res.json({
      success: true,
      message: "Customer updated successfully",
      customer: withComputed(customer),
    });
  } catch (err) {
    console.error("updateCustomer error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────
   DELETE
───────────────────────────────────────────────────── */
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    console.error("deleteCustomer error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────
   BULK DELETE
───────────────────────────────────────────────────── */
export const bulkDeleteCustomers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "No customer ids provided" });

    const result = await Customer.deleteMany({ _id: { $in: ids } });
    res.json({
      success: true,
      message: `${result.deletedCount} customer(s) deleted`,
    });
  } catch (err) {
    console.error("bulkDeleteCustomers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────
   BULK ASSIGN SALES PERSON
───────────────────────────────────────────────────── */
export const bulkAssignSalesPerson = async (req, res) => {
  try {
    const { ids, salesPerson } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !salesPerson)
      return res
        .status(400)
        .json({ success: false, message: "ids and salesPerson are required" });

    await Customer.updateMany({ _id: { $in: ids } }, { $set: { salesPerson } });
    res.json({
      success: true,
      message: `Sales person assigned to ${ids.length} customer(s)`,
    });
  } catch (err) {
    console.error("bulkAssignSalesPerson error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────
   ADD TIMELINE ENTRY
───────────────────────────────────────────────────── */
export const addTimelineEntry = async (req, res) => {
  try {
    const { type, note, date } = req.body;
    if (!type || !note)
      return res
        .status(400)
        .json({ success: false, message: "type and note are required" });

    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    if (!Array.isArray(customer.timeline)) customer.timeline = [];
    customer.timeline.unshift({ type, note, date: date || new Date() });

    if (type === "Follow-up") customer.isFollowUpDone = true;

    await customer.save();
    res.json({
      success: true,
      message: "Timeline entry added",
      customer: withComputed(customer),
    });
  } catch (err) {
    console.error("addTimelineEntry error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────
   STATS  (MongoDB aggregation — no full collection scan)
───────────────────────────────────────────────────── */
export const getCustomerStats = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [counts, financials] = await Promise.all([
      // Counts via aggregation (fast, no full document load)
      Customer.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
            outstanding: { $sum: { $ifNull: ["$outstanding", 0] } },
          },
        },
      ]),

      // Monthly sales placeholder (replace with real Order aggregate later)
      Customer.aggregate([
        { $match: { lastOrderDate: { $gte: startOfMonth } } },
        {
          $group: {
            _id: null,
            sales: {
              $sum: { $multiply: [{ $ifNull: ["$creditLimit", 0] }, 0.18] },
            },
          },
        },
      ]),
    ]);

    // Follow-up status needs date logic → still done in JS, but lean + projection only
    const followUpDocs = await Customer.find(
      { isFollowUpDone: { $ne: true }, followUpCancelled: { $ne: true } },
      { nextFollowUpDate: 1, isFollowUpDone: 1, followUpCancelled: 1 },
    ).lean();

    const pendingFollowUps = followUpDocs.filter((c) =>
      ["today", "tomorrow", "overdue"].includes(followUpStatus(c)),
    ).length;

    const row = counts[0] || { total: 0, active: 0, outstanding: 0 };

    res.json({
      success: true,
      stats: {
        totalCustomers: row.total,
        activeCustomers: row.active,
        pendingFollowUps,
        outstandingPayment: row.outstanding,
        monthlySales: Math.round(financials[0]?.sales ?? 0),
      },
    });
  } catch (err) {
    console.error("getCustomerStats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
