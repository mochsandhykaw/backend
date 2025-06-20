const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: [true, `Nama is required`],
    },
    telp: {
      type: String,
      required: [true, "No Telp is required"],
      match: [
        /^\+?(\d{1,3})?[-. ]?(\d{1,4})[-. ]?(\d{1,4})[-. ]?(\d{1,4})$/,
        "Please provide a valid phone number",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: [/\S+@\S+\.\S+/, "Please provide a valid email address"],
    },
    tujuan: {
      type: String,
      required: [true, `Tujuan is required`],
    },
    jenisPekerjaan: {
      type: String,
      required: [true, `Jenis Pekerjaan is required`],
    },
    sumberInfo: {
      type: String,
      required: [true, `Sumber Informasi is required`],
    },
    usernameMedsos: {
      type: String,
      required: [true, `Username Medsos is required`],
    },
    cv: {
      url: {
        type: String,
        required: [true, "CV is required"],
      },
      public_id: String,
    },
    berkas: {
      url: {
        type: String,
        required: [true, "Berkas is required"],
      },
      public_id: String,
    },
    passport: {
      url: String,
      public_id: String,
    },
    skck: {
      url: String,
      public_id: String,
    },
    pasFoto: {
      url: {
        type: String,
        required: [true, "Pas Foto is required"],
      },
      public_id: String,
    },
    fullFoto: {
      url: {
        type: String,
        required: [true, "Full Foto is required"],
      },
      public_id: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Registration", registrationSchema);
