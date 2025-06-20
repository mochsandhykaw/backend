const express = require("express");
const multer = require("multer");
const router = express.Router();
const { createNews, getAllNews } = require("../controllers/news");

// Konfigurasi Multer (gunakan memoryStorage untuk file sementara)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/news/create", upload.single("img"), createNews);
router.get("/news", getAllNews);

module.exports = router;
