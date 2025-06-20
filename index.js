const express = require("express");
const emailRoutes = require("./routes/send-email");
const countryRoutes = require("./routes/country");
const jobRoutes = require("./routes/job-vacancies");
const regRoutes = require("./routes/registration");
const newsRoutes = require("./routes/news");
const agent = require("./routes/agent");
const user = require("./routes/user");
const role = require("./routes/role");
const login = require("./routes/login");
const logout = require("./routes/logout");
const auth = require("./routes/auth"); // ganti sesuai lokasi file
const cookieParser = require("cookie-parser");

const fileUpload = require("express-fileupload");
const app = express();

require("dotenv").config();
app.use(express.json());
const cors = require("cors");
// app.use(cors());
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());

app.use(express.json());
app.use("/api", auth);
app.use("/api", emailRoutes);
app.use("/api", countryRoutes);
app.use("/api", jobRoutes);
app.use("/api", regRoutes);
app.use("/api", newsRoutes);
app.use("/api", user);
app.use("/api", agent);
app.use("/api", role);
app.use("/api", login);
app.use("/api", logout);

const db = require("./db/connect");

// Mengimpor konfigurasi Cloudinary
const configureCloudinary = require("./config/cloudinaryConfig");
// Memanggil konfigurasi Cloudinary
configureCloudinary();

// Middleware to parse file uploads
app.use(
  fileUpload({
    useTempFiles: true, // Use temporary files during upload
    tempFileDir: "/tmp/", // Temp directory for uploads
  })
);

const start = async () => {
  try {
    await db(process.env.MONGO_URI);

    const port = process.env.PORT;
    return app.listen(port, console.log(`success connect to port ${port}`));
  } catch (error) {
    return console.log(error);
  }
};

start();
