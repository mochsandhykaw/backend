const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    titleId: {
      type: String,
      required: [true, `Title id is required`],
    },
    titleEn: {
      type: String,
      required: [true, `Title En is required`],
    },
    descId: {
      type: String,
      required: [true, `Description Id is required`],
    },
    descEn: {
      type: String,
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

module.exports = mongoose.model("News", newsSchema);
