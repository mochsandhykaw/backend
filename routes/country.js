const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  createCountry,
  getAllCountries,
  getCountryById,
  deleteCountry,
  updateCountry,
} = require("../controllers/country");

// Konfigurasi Multer (gunakan memoryStorage untuk file sementara)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Rute POST untuk membuat country
router.post("/country/create", upload.single("img"), createCountry);
router.get("/countries", getAllCountries);
router.get("/country/:id", getCountryById);
router.delete("/country/:id", deleteCountry);
router.patch("/country/:id", upload.single("img"), updateCountry);

module.exports = router;
