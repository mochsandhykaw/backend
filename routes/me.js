const jwt = require("jsonwebtoken");

app.get("/api/me", (req, res) => {
  const token = req.cookies.token; // misal cookie namanya "token"
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});
