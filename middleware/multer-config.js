const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Configuration
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    const name = file.originalname.replace(/[\s.]+/g, "_");
    const extension = MIME_TYPES[file.mimetype];
    callback(null, `${name}${Date.now()}.${extension}`);
  },
});

const upload = multer({ storage: storage }).single("image");

const convertImages = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filePath = req.file.path;
  const outputFileName = req.file.filename.replace(
    /\.(jpg|jpeg|png)$/,
    ".webp"
  );
  const outputFilePath = path.join("images", `resized_${outputFileName}`);

  sharp(filePath)
    .webp()
    .toFile(outputFilePath)
    .then(() => {
      fs.unlink(filePath, () => {
        req.file.path = outputFilePath;
        req.file.filename = outputFileName;
        next();
      });
    })
    .catch((err) => {
      console.log(err);
      return next();
    });
};

module.exports = { upload, convertImages };
