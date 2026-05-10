const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const ApiError = require("../utils/apiError");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError("نوع الملف غير مدعوم", 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

exports.uploadSingle = (fieldName) => upload.single(fieldName);

const ensureUploadDirectory = (folder) => {
  const dirPath = path.join(process.cwd(), "uploads", folder);
  fs.mkdirSync(dirPath, { recursive: true });
};

exports.resizeImage = (
  folder,
  width = 800,
  height = 800,
  fieldName = "coverImage",
) => {
  return async (req, res, next) => {
    try {
      req.body = req.body || {};

      if (!req.file || !req.file.mimetype.startsWith("image")) {
        return next();
      }

      const filename = `${folder}-${Date.now()}.jpeg`;
      ensureUploadDirectory(folder);
      const filePath = path.join(process.cwd(), "uploads", folder, filename);

      await sharp(req.file.buffer)
        .resize(width, height, { fit: "cover" })
        .jpeg({ quality: 90 })
        .toFile(filePath);

      req.body[fieldName] = `/uploads/${folder}/${filename}`;

      next();
    } catch (error) {
      next(error);
    }
  };
};

exports.processLessonPDF = (folder = "lessons") => {
  return async (req, res, next) => {
    try {
      req.body = req.body || {};

      if (!req.file || req.file.mimetype !== "application/pdf") {
        return next();
      }

      const filename = `lesson-${Date.now()}.pdf`;
      ensureUploadDirectory(folder);
      const filePath = path.join(process.cwd(), "uploads", folder, filename);

      fs.writeFileSync(filePath, req.file.buffer);

      req.body.contentUrl = `/uploads/${folder}/${filename}`;

      next();
    } catch (error) {
      next(error);
    }
  };
};
