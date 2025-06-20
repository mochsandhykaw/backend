const cloudinary = require("cloudinary").v2;
const registrationSchema = require("../models/registration");
const asyncWrapper = require("../middleware/async-wrapper");
const { created, badRequest } = require("../middleware/response");

const maxFileSize = 5 * 1024 * 1024; // Max file size 5MB
const allowedPdfType = /application\/(pdf|x-pdf)/;
const allowedImgType = /image\/(jpeg|png|jpg)/;

const createRegistration = asyncWrapper(async (req, res) => {
  let {
    nama,
    telp,
    email,
    tujuan,
    jenisPekerjaan,
    sumberInfo,
    usernameMedsos,
  } = req.body;
  const files = req.files;

  console.log("Received files:", req.files); // Debugging

  // 🔥 1. Validasi Input Dasar 🔥
  const missingFields = [];
  if (!nama) missingFields.push("nama");
  if (!telp) missingFields.push("telp");
  if (!email) missingFields.push("email");
  if (!tujuan) missingFields.push("tujuan");
  if (!jenisPekerjaan) missingFields.push("jenisPekerjaan");
  if (!sumberInfo) missingFields.push("sumberInfo");

  // 🔥 2. Validasi Format Email & Nomor Telepon 🔥
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return badRequest(res, "Invalid email format");

  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phoneRegex.test(telp))
    return badRequest(res, "Invalid phone number format");

  // 🔥 3. Validasi Keberadaan File yang Harus Ada 🔥
  const requiredFiles = ["cv", "berkas", "pasFoto", "fullFoto"];
  if (!files) return badRequest(res, "No files uploaded");

  requiredFiles.forEach((key) => {
    if (!files[key]) missingFields.push(key);
  });

  if (missingFields.length > 0) {
    return badRequest(
      res,
      `The following fields are required: ${missingFields.join(", ")}`
    );
  }

  // 🔥 4. Validasi & Upload ke Cloudinary 🔥
  const allowedKeys = [
    { key: "cv", type: "pdf" },
    { key: "berkas", type: "pdf" },
    { key: "passport", type: "pdf" },
    { key: "skck", type: "pdf" },
    { key: "pasFoto", type: "image" },
    { key: "fullFoto", type: "image" },
  ];

  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const allowedPdfType = /^application\/pdf$/;
  const allowedImgType = /^image\/(png|jpe?g)$/;

  try {
    // Gunakan Promise.all untuk paralel upload
    const uploadPromises = allowedKeys.map(async ({ key, type }) => {
      if (files[key]) {
        const file = files[key][0];

        // Validasi ukuran file
        if (file.size > maxFileSize)
          throw new Error(`${key} exceeds the maximum file size of 5MB`);

        // Validasi tipe file
        if (type === "pdf" && !allowedPdfType.test(file.mimetype))
          throw new Error(`${key} must be a PDF file`);
        if (type === "image" && !allowedImgType.test(file.mimetype))
          throw new Error(`${key} must be a PNG or JPG file`);

        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `registrations/${key}`,
              public_id: `${key}_${nama.replace(/\s+/g, "_")}_${Date.now()}`,
              resource_type: type === "pdf" ? "raw" : "image",
            },
            (error, result) => {
              if (error)
                reject(
                  new Error(
                    `Cloudinary upload failed for ${key}: ${error.message}`
                  )
                );
              else
                resolve({
                  key,
                  url: result.secure_url,
                  public_id: result.public_id,
                });
            }
          );
          stream.end(file.buffer);
        });
      } else {
        return { key, url: "", public_id: "" };
      }
    });

    const uploadResultsArray = await Promise.all(uploadPromises);
    const uploadResults = Object.fromEntries(
      uploadResultsArray.map(({ key, url, public_id }) => [
        key,
        { url, public_id },
      ])
    );

    // 🔥 5. Simpan Data Registrasi ke Database 🔥
    const registration = await registrationSchema.create({
      nama,
      telp,
      email,
      tujuan,
      jenisPekerjaan,
      sumberInfo,
      usernameMedsos,
      ...uploadResults,
    });

    return created(res, registration, "Registration created successfully");
  } catch (error) {
    console.error("Error processing registration:", error);
    return badRequest(res, error.message || "Failed to process registration");
  }
});

const getAllRegistration = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10, name, month, year } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  let filter = {};
  if (name) {
    filter.nama = { $regex: name, $options: "i" };
  }

  if (month && year) {
    const startDate = new Date(year, month - 1, 1); // Awal bulan
    const endDate = new Date(year, month, 0, 23, 59, 59); // Akhir bulan
    filter.createdAt = { $gte: startDate, $lte: endDate };
  }

  console.log("Filter MongoDB:", filter); // Debugging
  const registrations = await registrationSchema
    .find(filter)
    .skip(skip)
    .limit(limitNumber);

  const totalDocuments = await registrationSchema.countDocuments(filter);
  const totalPages = Math.ceil(totalDocuments / limitNumber);

  res.status(200).json({
    success: true,
    totalDocuments,
    totalPages,
    currentPage: pageNumber,
    data: registrations,
  });
});

const getRegistrationById = asyncWrapper(async (req, res) => {
  const { id } = req.params; // Ambil ID dari URL param

  if (!id) {
    return res.status(400).json({ success: false, message: "ID diperlukan" });
  }

  try {
    const registration = await registrationSchema.findById(id);

    if (!registration) {
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan" });
    }

    res.status(200).json({ success: true, data: registration });
  } catch (error) {
    res.status(400).json({ success: false, message: "ID tidak valid" });
  }
});

module.exports = {
  createRegistration,
  getAllRegistration,
  getRegistrationById,
};
