const express = require("express");
const auth = require("../middleware/auth");
const {
  upload: multer,
  convertImages,
} = require("../middleware/multer-config");

const router = express.Router();
const bookCtrl = require("../controllers/book");

router.get("/", bookCtrl.getAllBook);
router.post("/", auth, multer, convertImages, bookCtrl.createBook);
router.get("/:id", bookCtrl.getOneBook);
router.put("/:id", auth, multer, convertImages, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);
router.post("/:id/rating", auth, bookCtrl.rateBook);

module.exports = router;
