import Note from "../models/noteModel.js";

// Shape returned to the client (kept consistent across all responses)
const formatNote = (note) => ({
  id: note._id,
  title: note.title,
  content: note.content,
  tags: note.tags,
  pinned: note.pinned,
  favorite: note.favorite,
  archived: note.archived,
  color: note.color,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

// ────────────────────────────────────────────
// GET ALL NOTES (for the logged-in user) — GET /api/notes
// Supports optional query params: ?search=&tag=&filter=pinned|favorite|archived
// ────────────────────────────────────────────
export const getNotes = async (req, res) => {
  try {
    const { search, tag, filter } = req.query;
    const query = { user: req.user.id };

    if (filter === "archived") {
      query.archived = true;
    } else {
      query.archived = false; // default: hide archived notes
    }
    if (filter === "pinned") query.pinned = true;
    if (filter === "favorite") query.favorite = true;
    if (tag) query.tags = tag;

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const notes = await Note.find(query).sort({ pinned: -1, updatedAt: -1 });
    res.json({ success: true, notes: notes.map(formatNote) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// GET SINGLE NOTE — GET /api/notes/:id
// ────────────────────────────────────────────
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note)
      return res.status(404).json({ success: false, message: "Note not found" });
    res.json({ success: true, note: formatNote(note) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// CREATE NOTE — POST /api/notes
// ────────────────────────────────────────────
export const createNote = async (req, res) => {
  try {
    const { title, content, tags, color } = req.body;

    const note = await Note.create({
      user: req.user.id,
      title: title || "Untitled note",
      content: content || "<p></p>",
      tags: Array.isArray(tags) ? tags : [],
      color: color || null,
    });

    res.status(201).json({ success: true, note: formatNote(note) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// UPDATE NOTE (title, content, tags, color, etc.) — PUT /api/notes/:id
// Used for autosave from the editor
// ────────────────────────────────────────────
export const updateNote = async (req, res) => {
  try {
    const allowedFields = ["title", "content", "tags", "color", "pinned", "favorite", "archived"];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!note)
      return res.status(404).json({ success: false, message: "Note not found" });

    res.json({ success: true, note: formatNote(note) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// DELETE NOTE — DELETE /api/notes/:id
// ────────────────────────────────────────────
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!note)
      return res.status(404).json({ success: false, message: "Note not found" });

    res.json({ success: true, message: "Note deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// TOGGLE PIN — PATCH /api/notes/:id/pin
// ────────────────────────────────────────────
export const togglePin = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note)
      return res.status(404).json({ success: false, message: "Note not found" });

    note.pinned = !note.pinned;
    await note.save();

    res.json({ success: true, note: formatNote(note) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// TOGGLE FAVORITE — PATCH /api/notes/:id/favorite
// ────────────────────────────────────────────
export const toggleFavorite = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note)
      return res.status(404).json({ success: false, message: "Note not found" });

    note.favorite = !note.favorite;
    await note.save();

    res.json({ success: true, note: formatNote(note) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// TOGGLE ARCHIVE — PATCH /api/notes/:id/archive
// ────────────────────────────────────────────
export const toggleArchive = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note)
      return res.status(404).json({ success: false, message: "Note not found" });

    note.archived = !note.archived;
    await note.save();

    res.json({ success: true, note: formatNote(note) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
