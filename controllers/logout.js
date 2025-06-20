const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production", // true di production
  });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = logout;
