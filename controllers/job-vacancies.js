const JobVacancy = require("../models/job-vacancies");
const Country = require("../models/country"); // Pastikan model ini sesuai
const asyncWrapper = require("../middleware/async-wrapper");
const { created, conflict, badRequest } = require("../middleware/response");

// CREATE JOB
const createJob = asyncWrapper(async (req, res) => {
  const { country, jobDescId, jobDescEn, salary, regFee, status } = req.body;

  // Validasi data wajib
  if (!country || !jobDescId || !jobDescEn || !salary || !regFee || !status) {
    return badRequest(
      res,
      "All fields are required: country, jobDescId, jobDescEn, salary, regFee, status"
    );
  }

  const requiredFields = ["jobName", "jobBenefit", "jobQualification"];
  for (const field of requiredFields) {
    if (!jobDescId[field]) {
      return badRequest(res, `Field '${field}' is required in jobDescId`);
    }
    if (!jobDescEn[field]) {
      return badRequest(res, `Field '${field}' is required in jobDescEn`);
    }
  }

  // Cek duplikasi data
  const existingJob = await JobVacancy.findOne({
    country,
    "jobDescId.jobName": jobDescId.jobName,
    "jobDescEn.jobName": jobDescEn.jobName,
  });

  if (existingJob) {
    return conflict(
      res,
      "Job with this name already exists for the specified country"
    );
  }

  // Membuat dokumen baru
  const newJob = new JobVacancy({
    country,
    jobDescId: { ...jobDescId },
    jobDescEn: { ...jobDescEn },
    salary,
    regFee,
    status,
  });

  await newJob.save();

  return created(res, "Job created successfully", newJob);
});

const getAllJob = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10, countryName } = req.query;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNumber - 1) * limitNumber;

  let filter = {};

  if (countryName) {
    const country = await Country.findOne({ nameId: countryName });
    if (country) {
      filter.country = country._id;
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Country not found" });
    }
  }

  const jobVacancies = await JobVacancy.find(filter)
    .skip(skip)
    .limit(limitNumber)
    .populate("country");

  const totalDocuments = await JobVacancy.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: jobVacancies.length,
    totalPages: Math.ceil(totalDocuments / limitNumber),
    currentPage: pageNumber,
    data: jobVacancies,
  });
});

const updateJobStatus = asyncWrapper(async (req, res) => {
  const { jobId } = req.params; // Mendapatkan ID pekerjaan dari URL
  const { status } = req.body; // Mendapatkan status baru dari body request

  // Validasi status yang diterima
  if (!status || !["open", "closed"].includes(status)) {
    return badRequest(
      res,
      "Invalid status. Allowed values are 'open' or 'closed'."
    );
  }

  // Mencari pekerjaan berdasarkan ID
  const job = await JobVacancy.findById(jobId);
  if (!job) {
    return notFound(res, "Job not found.");
  }

  // Memperbarui status pekerjaan
  job.status = status;
  await job.save();

  return res.status(200).json({
    success: true,
    message: `Job status updated to ${status}`,
    data: job,
  });
});

const getCountriesWithJobs = async (req, res) => {
  try {
    const { countryName } = req.query;

    // Membuat pipeline untuk agregasi
    const pipeline = [
      {
        $match: countryName ? { name: countryName } : {}, // Filter berdasarkan nama country jika disediakan
      },
      {
        $lookup: {
          from: "jobvacancies", // Nama koleksi di MongoDB (bukan nama model)
          localField: "_id", // Field di Country yang akan digunakan
          foreignField: "country", // Field di JobVacancy yang cocok
          as: "jobs", // Nama field untuk output pekerjaan
        },
      },
    ];

    // Menjalankan agregasi
    const countriesWithJobs = await Country.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: countriesWithJobs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  createJob,
  getAllJob,
  getCountriesWithJobs,
  updateJobStatus,
};
