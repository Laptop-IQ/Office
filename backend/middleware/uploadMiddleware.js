import multer from "multer";

// ── Memory storage ─────────────────────────────────────────────────────────
// Buffer is available as req.file.buffer — no temp file on disk.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel",                                           // .xls
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .xlsx / .xls files are accepted"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export default upload;
