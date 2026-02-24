import multer from "multer";

const ALLOWED_MIMES = ["audio/mpeg", "video/mp4"];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format. Please upload an MP3 or MP4 file."));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});
