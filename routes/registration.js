const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  createRegistration,
  getAllRegistration,
  getRegistrationById,
} = require("../controllers/registration");

// Konfigurasi Multer (gunakan memoryStorage untuk file sementara)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Rute POST untuk membuat registration dengan multiple files
router.post(
  "/registration",
  upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "berkas", maxCount: 1 },
    { name: "passport", maxCount: 1 },
    { name: "skck", maxCount: 1 },
    { name: "pasFoto", maxCount: 1 },
    { name: "fullFoto", maxCount: 1 },
  ]),
  createRegistration
);

router.get("/registrations", getAllRegistration);
router.get("/registration/:id", getRegistrationById);

module.exports = router;
