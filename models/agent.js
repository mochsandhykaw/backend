const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
  {
    agentName: {
      type: String,
      required: [true, "Agent name is required"],
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country", // Sesuai dengan model yang diekspor dari country.js
      required: [true, "Country is required"],
    },
    agentDetail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentDetail", // Sesuai dengan model dari agent-detail.js
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Agent", agentSchema); // Sesuaikan dengan huruf besar
