import express from "express";
import { jwtVerify } from "../Middlewares/jwt.middleware.js";
import {
getNotes,
addNote,
UpdateNotes,
deleteFromTrashed
} from "../Controlllers/notes.controller.js";

const router = express.Router();

// ✅ Get all notes by status (archived, pinned, trashed, etc.)
router.get("/", jwtVerify, getNotes);

// ✅ Add a new note
router.post("/addNotes", jwtVerify, addNote);

// ✅ Update a note (title, content, status, etc.)
router.put("/updateNote/:noteId", jwtVerify, UpdateNotes);

// ✅ Permanently delete note from trash
router.delete("/trash/:noteId", jwtVerify, deleteFromTrashed);

export default router;
