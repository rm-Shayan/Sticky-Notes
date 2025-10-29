import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Define upload destination folder
const tempDir = path.join(process.cwd(), "Public", "Temp");

// ✅ Ensure the folder exists (create if not)
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// ✅ Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// ✅ File filter (allow only image types)
const fileFilter = (req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|webp|gif|svg/;
  const allowedMime = /jpeg|jpg|png|webp|gif|svg\+xml|svg/; // allow svg loosely

  const extname = allowedExt.test(path.extname(file.originalname).toLowerCase().slice(1));
  const mime = allowedMime.test(file.mimetype.toLowerCase());

  if (extname && mime) cb(null, true);
  else cb(new Error("Only image files (jpeg, jpg, png, webp, gif, svg) are allowed!"));
};


// ✅ Create Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
