const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: [true, "Role name is required"],
      unique: true, // Role name biasanya unik
      trim: true, // Hilangkan spasi berlebih
      lowercase: true, // Simpan role dalam huruf kecil agar konsisten
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Role", roleSchema);
