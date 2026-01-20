import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_, file, cb) {
    const allowed = ["image/png", "image/jpeg", "image/svg+xml"];
    cb(null, allowed.includes(file.mimetype));
  }
});
