// routes/records.js
// REMOVED — this legacy router read/changed records of ALL users (no per-user filter) and was
// never mounted. The user-scoped replacement is the dsr router mounted in server.js.
// This empty stub is only here so nothing can accidentally expose the old behaviour;
// you can safely delete the file.
import express from "express";

export default express.Router();
