const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  created,
  conflict,
  notFound,
  forbidden,
  badRequest,
  unauthorized,
} = require("../middleware/response");

const login = async (req, res) => {
  const { email, password } = req.body;

  // Validasi
  if (!email || !password) {
    return badRequest(res, "Email and password are required");
  }

  // Cari user berdasarkan email dan populate data relasional
  const user = await User.findOne({ email })
    .populate("role")
    .populate({
      path: "agent",
      populate: {
        path: "country",
        select: "nameId", // ambil nama negara saja
      },
    });

  if (!user) {
    return unauthorized(res, "Invalid credential");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return unauthorized(res, "Invalid credentials");
  }

  if (!user.status) {
    return forbidden(res, "User is inactive");
  }

  // Buat JWT
  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role.name,
      agent: user.agent?.name || user.agent?._id || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true jika di hosting HTTPS
    sameSite: "Strict", // atau 'Lax'
    maxAge: 24 * 60 * 60 * 1000, // 1 hari
  });

  res.json({ message: "Login successful" });
};

module.exports = { login };
