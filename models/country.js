const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema(
  {
    nameId: {
      type: String,
      required: [true, `Name id is required`],
    },
    nameEn: {
      type: String,
      required: [true, `Name En is required`],
    },
    descId: {
      type: [String],
      required: [true, `Description Id is required`],
    },
    descEn: {
      type: [String],
      required: [true, `Description En is required`],
    },
    img: {
      url: {
        type: String,
        required: [true, "Image is required"],
      },
      public_id: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Country", countrySchema);
