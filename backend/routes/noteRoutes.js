import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
  toggleFavorite,
  toggleArchive,
} from "../controllers/noteController.js";

const router = express.Router();

// All note routes require a logged-in user
router.use(protect);

router.get("/", getNotes); // GET    /api/notes?search=&tag=&filter=
router.post("/", createNote); // POST   /api/notes
router.get("/:id", getNoteById); // GET    /api/notes/:id
router.put("/:id", updateNote); // PUT    /api/notes/:id   (autosave)
router.delete("/:id", deleteNote); // DELETE /api/notes/:id

router.patch("/:id/pin", togglePin); // PATCH  /api/notes/:id/pin
router.patch("/:id/favorite", toggleFavorite); // PATCH  /api/notes/:id/favorite
router.patch("/:id/archive", toggleArchive); // PATCH  /api/notes/:id/archive

export default router;
