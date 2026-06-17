import Customer from "../models/Customer.js";

// ── GET /api/dsr/customers ───────────────────────────────────────────────────
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ user: req.user.id }).sort({
      name: 1,
    });

    // Return as object map { name: {...data} } to match frontend shape
    const map = {};
    customers.forEach((c) => {
      map[c.name] = {
        _id: c._id,
        area: c.area,
        distributor: c.distributor,
        stage: c.stage,
        potDyes: c.potDyes,
        potAux: c.potAux,
        exDyes: c.exDyes,
        exAux: c.exAux,
        abp: c.abp,
      };
    });

    return res.status(200).json({ success: true, data: map });
  } catch (err) {
    console.error("getCustomers error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── POST /api/dsr/customers ──────────────────────────────────────────────────
export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      area,
      distributor,
      stage,
      potDyes,
      potAux,
      exDyes,
      exAux,
      abp,
    } = req.body;

    if (!name || !area || !distributor || !stage) {
      return res.status(400).json({
        success: false,
        message: "name, area, distributor, and stage are required.",
      });
    }

    // Check duplicate
    const exists = await Customer.findOne({
      user: req.user.id,
      name: name.trim(),
    });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Customer already exists.",
      });
    }

    const customer = await Customer.create({
      user: req.user.id,
      name: name.trim(),
      area,
      distributor,
      stage,
      potDyes: Number(potDyes) || 0,
      potAux: Number(potAux) || 0,
      exDyes: Number(exDyes) || 0,
      exAux: Number(exAux) || 0,
      abp: Number(abp) || 0,
    });

    return res.status(201).json({
      success: true,
      data: {
        [customer.name]: {
          _id: customer._id,
          area: customer.area,
          distributor: customer.distributor,
          stage: customer.stage,
          potDyes: customer.potDyes,
          potAux: customer.potAux,
          exDyes: customer.exDyes,
          exAux: customer.exAux,
          abp: customer.abp,
        },
      },
    });
  } catch (err) {
    console.error("createCustomer error:", err);
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Customer already exists." });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PUT /api/dsr/customers/:id ───────────────────────────────────────────────
export const updateCustomer = async (req, res) => {
  try {
    const allowed = [
      "name",
      "area",
      "distributor",
      "stage",
      "potDyes",
      "potAux",
      "exDyes",
      "exAux",
      "abp",
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    ["potDyes", "potAux", "exDyes", "exAux", "abp"].forEach((k) => {
      if (updates[k] !== undefined) updates[k] = Number(updates[k]) || 0;
    });
    if (updates.name) updates.name = updates.name.trim();

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    return res.status(200).json({ success: true, data: customer });
  } catch (err) {
    console.error("updateCustomer error:", err);
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Customer name already exists." });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── DELETE /api/dsr/customers/:id ────────────────────────────────────────────
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    console.error("deleteCustomer error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
