import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Untitled note",
      trim: true,
    },
    content: {
      type: String, // stores HTML from the rich text editor
      default: "<p></p>",
    },
    tags: {
      type: [String],
      default: [],
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String, // hex color or null
      default: null,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Useful indexes for common queries
noteSchema.index({ user: 1, pinned: -1, updatedAt: -1 });
noteSchema.index({ user: 1, archived: 1 });
noteSchema.index({ title: "text", content: "text" }); // for server-side search

const Note = mongoose.model("Note", noteSchema);

export default Note;
