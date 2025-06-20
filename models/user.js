const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: [true, "Role is required"],
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
    required: false,
  },
  status: {
    type: Boolean,
    required: [true, "Status is required"],
  },
});

module.exports = mongoose.model("User", userSchema);
