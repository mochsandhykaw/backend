const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authenticate");
const User = require("../models/user");

// GET /api/me
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("role", "roleName") // ambil nama role
      .select("email role"); // batasi hanya field yang dibutuhkan

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      email: user.email,
      role: user.role, // contoh: { _id: "...", roleName: "superadmin" }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
