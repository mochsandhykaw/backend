const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

// Sub-schema untuk deskripsi pekerjaan
const jobDescriptionSchema = new mongoose.Schema(
  {
    jobName: { type: String, required: true },
    jobBenefit: { type: [String], default: [] },
    jobQualification: { type: [String], default: [] },
  },
  { _id: false } // Tidak perlu _id untuk sub-skema
);

// Schema utama untuk lowongan pekerjaan
const jobVacanciesSchema = new mongoose.Schema(
  {
    country: { type: ObjectId, ref: "Country" }, // Referensi ke model Country
    jobDescId: { type: jobDescriptionSchema },
    jobDescEn: { type: jobDescriptionSchema },
    salary: { type: Number, min: 0 },
    regFee: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["open", "closed", "pending"], // Status terbatas
      default: "pending",
    },
  },
  {
    timestamps: true, // Menambahkan createdAt dan updatedAt
  }
);

module.exports = mongoose.model("JobVacancy", jobVacanciesSchema);
