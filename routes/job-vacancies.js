const express = require("express");
const router = express.Router();
const {
  createJob,
  getAllJob,
  getCountriesWithJobs,
  updateJobStatus,
} = require("../controllers/job-vacancies");

router.post("/job/create", createJob);
router.get("/jobs", getAllJob);
router.get("/jobcountries", getCountriesWithJobs);
router.put("/job/:jobId/status", updateJobStatus);

module.exports = router;
