import Note from "../Models/notes.model.js";
import {ApiError} from "../Utilities/ApiError.js";
import {ApiResponse} from "../Utilities/ApiResponse.js";
import {asyncHandler} from "../Utilities/Asynchandler.js";
import mongoose from "mongoose";


export const addNote = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request body is missing");
  }

  const { title, content, color, status, isPinned, tags, reminder} = req.body;

  if (!title || !color || typeof isPinned === "undefined" || !status) {
    throw new ApiError(400, "Missing required fields (title, color, status, isPinned)");
  }

  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  // Check if note with same title exists
  const existingNote = await Note.findOne({ title, user: req.user.id });
  if (existingNote) {
    throw new ApiError(409, "Note with this title already exists");
  }

  // Create new note
const newNote = await Note.create({
  title,
  content: content || "",
  color,
  status,
  isPinned,
  tags: Array.isArray(tags) ? tags : [],
  user: req.user.id,                     // ✅ use _id
  reminder: reminder ? new Date(reminder) : null // ✅ parse date
});

  res.status(201).json(new ApiResponse(201,[newNote], "Note added successfully"));
});


export const getNotes = asyncHandler(async (req, res) => {
  // ✅ Check if user is authenticated
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  // ✅ Fetch all notes of user
  const notes = await Note.find({ userId: req.user._id });

  if (!notes || notes.length === 0) {
    return res.status(200).json( new ApiResponse(200,[],"No notes found"));
  }

  // ✅ Group notes by status and pinned
  const groupedNotes = {
    pinned: [],
    archived: [],
    draft: [],
    trashed: [],
    other: [],
  };

  notes.forEach((note) => {
    if (note.isPinned) {
      groupedNotes.pinned.push(note);
    } else if (note.status === "archived") {
      groupedNotes.archived.push(note);
    } else if (note.status === "draft") {
      groupedNotes.draft.push(note);
    } else if (note.status === "trashed") {
      groupedNotes.trashed.push(note);
    } else {
      groupedNotes.other.push(note);
    }
  });

  // ✅ Send response
  res.status(200).json( new ApiResponse(200,groupedNotes,"Notes fetched successfully"));
});

// ✅ Update Notes Controller
export const UpdateNotes = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  if (!noteId) {
    throw new ApiError(400, "Note ID is required");
  }

  if (!req.user || !req.user.id) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    throw new ApiError(400, "Request body is missing");
  }

  const { title, content, color, status, isPinned, tags,reminder } = req.body;

  // Find note by ID and user
  const note = await Note.findOne({ _id: noteId, user: req.user.id });

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  // Update only valid, non-empty fields
  if (title && title.trim() !== "") note.title = title.trim();
  if (content && content.trim() !== "") note.content = content.trim();
  if (color && color.trim() !== "") note.color = color.trim();
  if (status && ["draft", "active", "archived", "trashed"].includes(status))
    note.status = status;
  if (typeof isPinned === "boolean") note.isPinned = isPinned;
  if (Array.isArray(tags)) note.tags = tags;
     if (reminder) note.reminder = new Date(reminder);

  // Save updated note
  const updatedNote = await note.save();

  if (!updatedNote) {
    throw new ApiError(500, "Failed to update note");
  }

  // Send success response
  new ApiResponse(200, updatedNote, "Note updated successfully").send(res);
});



export const deleteFromTrashed = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  console.log("Note ID:", noteId);

  if (!req.user || !req.user.id) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!noteId) {
    throw new ApiError(400, "Note ID is required");
  }

  // ✅ Mongoose will auto-cast string to ObjectId, no need for 'new'
  const note = await Note.findOne({
    _id: noteId,
    user: req.user.id,
    status: "trashed",
  });

  console.log(note)
  if (!note) {
    throw new ApiError(404, "Trashed note not found");
  }

  // ✅ Permanently delete
  await note.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Note permanently deleted from trash"));
});
