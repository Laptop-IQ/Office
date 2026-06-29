// models/mindmapModel.js
import mongoose from "mongoose";

const nodeSchema = new mongoose.Schema(
  {
    id:         { type: String, required: true },
    text:       { type: String, default: "New Idea" },
    x:          { type: Number, default: 0 },
    y:          { type: Number, default: 0 },
    color:      { type: String, default: "#7c3aed" },
    shape:      { type: String, enum: ["rounded","pill","diamond","hexagon","circle"], default: "rounded" },
    fontSize:   { type: Number, default: 14 },
    bold:       { type: Boolean, default: false },
    italic:     { type: Boolean, default: false },
    note:       { type: String, default: "" },
    tag:        { type: String, default: "" },
    emoji:      { type: String, default: "" },
    collapsed:  { type: Boolean, default: false },
    locked:     { type: Boolean, default: false },
    image:      { type: String, default: "" },
    fontFamily: { type: String, default: "Inter" },
  },
  { _id: false }
);

const edgeSchema = new mongoose.Schema(
  {
    id:    { type: String, required: true },
    from:  { type: String, required: true },
    to:    { type: String, required: true },
    label: { type: String, default: "" },
    style: { type: String, enum: ["curve","straight","elbow","arc"], default: "curve" },
  },
  { _id: false }
);

const mindmapSchema = new mongoose.Schema(
  {
    owner:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title:  { type: String, default: "Untitled Mind Map" },
    nodes:  { type: [nodeSchema], default: [] },
    edges:  { type: [edgeSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("MindMap", mindmapSchema);
