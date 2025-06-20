const cloudinary = require("cloudinary").v2;
const schema = require("../models/news");
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

// Create a news
const createNews = asyncWrapper(async (req, res) => {
  // Destructure input
  let { titleId, titleEn, descId, descEn } = req.body;
  let img = req.file;

  // Validate file (check if the file exists, check size and type)
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
    // Upload file to Cloudinary using upload_stream for buffer
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "bdr/news", // Specify folder in Cloudinary (optional)
          resource_type: "image", // Ensure only images are uploaded
        },
        (error, result) => {
          if (error) {
            reject(new Error("Cloudinary upload failed"));
          } else {
            resolve(result);
          }
        }
      );

      // Pipe the file buffer to the upload stream
      stream.end(img.buffer);
    });

    // Create the news entry in the database
    const data = await schema.create({
      titleId,
      titleEn,
      descId, // Store the array as it is
      descEn, // Store the array as it is
      img: {
        url: uploadResult.secure_url, // Cloudinary image URL
        public_id: uploadResult.public_id, // Cloudinary public ID
      },
    });

    // Return success response
    return created(res, data, `News with title '${titleId}' is created`);
  } catch (error) {
    console.error("Error uploading file or saving data:", error);
    return badRequest(res, "Failed to upload file or save country data");
  }
});

//get all news
const getAllNews = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  let filter = {};

  const news = await schema.find(filter).skip(skip).limit(limitNumber);

  const totalDocuments = await schema.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: news.length,
    totalPages: Math.ceil(totalDocuments / limitNumber),
    currentPage: pageNumber,
    data: news,
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
  createNews,
  getAllNews,
};
