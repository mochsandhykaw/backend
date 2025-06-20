const cloudinary = require("cloudinary").v2;
const schema = require("../models/country");
const asyncWrapper = require("../middleware/async-wrapper");
const _ = require("lodash");
const {
  created,
  conflict,
  badRequest,
  notFound,
  ok,
} = require("../middleware/response");

const maxFileSize = (process.env.MAX_SIZE_COUNTRY || 5) * 1024 * 1024; // Max file size 5MB (default)
const allowedFileTypes = new RegExp(
  `${
    process.env.ALLOWED_TYPES_PICTURE?.split(",").join("|") ||
    "image/jpeg|image/png|image/jpg"
  }`
);

// Create a new country
const createCountry = asyncWrapper(async (req, res) => {
  // Destructure input
  let { description, nameId, nameEn, descId, descEn } = req.body;
  let img = req.file;

  // Karena descId dan descEn kemungkinan dikirim sebagai JSON string, kita harus parse dulu:
  try {
    descId = JSON.parse(descId);
    descEn = JSON.parse(descEn);
  } catch (err) {
    return badRequest(res, "descId or descEn is not valid JSON");
  }

  // Convert names to lowercase
  if (nameId && nameEn) {
    nameId = nameId.toLowerCase();
    nameEn = nameEn.toLowerCase();
  }

  // Validate that descId and descEn are arrays
  if (!Array.isArray(descId) || !Array.isArray(descEn)) {
    return badRequest(res, "descId and descEn must be arrays");
  }

  // Validate each element in the arrays
  const isValidArray = (arr) => arr.every((item) => typeof item === "string");
  if (!isValidArray(descId) || !isValidArray(descEn)) {
    return badRequest(
      res,
      "Each element in descId and descEn must be a string"
    );
  }

  // Cek jika negara sudah ada
  const countryExists = await schema.exists({ nameId: nameId });
  if (countryExists) {
    nameId = _.capitalize(nameId);
    return conflict(res, `Country with nameId '${nameId}' already exists`);
  }

  // Validasi file
  if (!img) {
    return badRequest(res, "Image is required");
  }

  if (img.size > maxFileSize) {
    return badRequest(res, "File size exceeds the maximum limit");
  }

  if (!allowedFileTypes.test(img.mimetype)) {
    return badRequest(res, "Invalid file type");
  }

  try {
    // Upload ke Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "bdr/countries",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(new Error("Cloudinary upload failed"));
          } else {
            resolve(result);
          }
        }
      );
      stream.end(img.buffer);
    });

    // Simpan data ke DB
    const data = await schema.create({
      nameId,
      nameEn,
      descId,
      descEn,
      description,
      img: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
    });

    return created(res, data, `Country with nameId '${nameId}' is created`);
  } catch (error) {
    console.error("Error uploading file or saving data:", error);
    return badRequest(res, "Failed to upload file or save country data");
  }
});

const getAllCountries = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10, countryName } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  let filter = {};

  if (countryName) {
    filter = {
      $or: [
        { nameId: { $regex: countryName, $options: "i" } },
        { nameEn: { $regex: countryName, $options: "i" } },
      ],
    };
  }

  const countries = await schema.find(filter).skip(skip).limit(limitNumber);

  const totalDocuments = await schema.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: countries.length,
    totalPages: Math.ceil(totalDocuments / limitNumber),
    currentPage: pageNumber,
    data: countries,
  });
});

const getCountryById = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Find the country by its ID
  const country = await schema.findById(id);

  // If the country is not found, return a 404 error
  if (!country) {
    return res
      .status(404)
      .json({ success: false, message: "Country not found" });
  }

  // Return the country data
  res.status(200).json({
    success: true,
    data: country,
  });
});
const deleteCountry = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Cari data negara berdasarkan id
  const country = await schema.findById(id);
  if (!country) {
    return notFound(res, "Country not found");
  }

  try {
    // Hapus image dari Cloudinary jika ada
    if (country.img && country.img.public_id) {
      await cloudinary.uploader.destroy(country.img.public_id);
    }

    // Hapus data negara dari database
    await schema.findByIdAndDelete(id);

    return ok(res, null, `Country with id '${id}' has been deleted`);
  } catch (error) {
    console.error("Error deleting country:", error);
    return badRequest(res, "Failed to delete country");
  }
});

const updateCountry = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  let { description, nameId, nameEn, descId, descEn } = req.body;
  const img = req.file;

  // Parse JSON jika perlu
  try {
    if (descId) descId = JSON.parse(descId);
    if (descEn) descEn = JSON.parse(descEn);
  } catch (err) {
    return badRequest(res, "descId or descEn is not valid JSON");
  }

  // Temukan negara yang akan diupdate
  const country = await schema.findById(id);
  if (!country) return notFound(res, "Country not found");

  // Validasi array jika ada
  const isValidArray = (arr) =>
    Array.isArray(arr) && arr.every((i) => typeof i === "string");

  if (descId && !isValidArray(descId)) {
    return badRequest(res, "descId must be an array of strings");
  }

  if (descEn && !isValidArray(descEn)) {
    return badRequest(res, "descEn must be an array of strings");
  }

  // Siapkan objek data yang akan diupdate
  const updateData = {};

  if (nameId) updateData.nameId = nameId.toLowerCase();
  if (nameEn) updateData.nameEn = nameEn.toLowerCase();
  if (description) updateData.description = description;
  if (descId) updateData.descId = descId;
  if (descEn) updateData.descEn = descEn;

  // Handle gambar baru (jika ada)
  if (img) {
    if (img.size > maxFileSize) {
      return badRequest(res, "File size exceeds the maximum limit");
    }

    if (!allowedFileTypes.test(img.mimetype)) {
      return badRequest(res, "Invalid file type");
    }

    // Upload gambar baru ke Cloudinary
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "bdr/countries",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(new Error("Cloudinary upload failed"));
            else resolve(result);
          }
        );
        stream.end(img.buffer);
      });

      // Hapus gambar lama jika ada
      if (country.img && country.img.public_id) {
        await cloudinary.uploader.destroy(country.img.public_id);
      }

      updateData.img = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    } catch (err) {
      console.error("Error uploading new image:", err);
      return badRequest(res, "Failed to upload new image");
    }
  }

  // Lakukan update
  const updatedCountry = await schema.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return ok(res, updatedCountry, `Country with id '${id}' has been updated`);
});

const getAllCountriesJob = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10, countryName } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  let filter = {};

  if (countryName) {
    const country = await schema.findOne({ name: countryName });
    if (country) {
      filter.country = country._id;
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Country not found" });
    }
  }

  const country = await schema.find(filter).skip(skip).limit(limitNumber);

  const totalDocuments = await schema.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: country.length,
    totalPages: Math.ceil(totalDocuments / limitNumber),
    currentPage: pageNumber,
    data: country,
  });
});

module.exports = {
  createCountry,
  getAllCountries,
  getAllCountriesJob,
  getCountryById,
  deleteCountry,
  updateCountry,
};
