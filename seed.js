require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db/connect");
const Role = require("./models/role");
const User = require("./models/user");

const seed = async () => {
  try {
    await db(process.env.MONGO_URI);

    // Hapus data lama
    await Role.deleteMany();
    await User.deleteMany();

    // Seed roles
    const roles = await Role.insertMany([
      { roleName: "superadmin" },
      { roleName: "admin" },
      { roleName: "agent" },
    ]);
    console.log("Roles seeded");

    // Cari role untuk dipakai
    const superadminRole = roles.find((r) => r.roleName === "superadmin");
    const adminRole = roles.find((r) => r.roleName === "admin");

    // Hash password
    const superPassword = await bcrypt.hash("supersecret", 10);
    const adminPassword = await bcrypt.hash("admin123", 10);

    // Seed superadmin tanpa agent
    await User.create({
      email: "superuser@example.com",
      password: superPassword,
      role: superadminRole._id,
      status: true,
    });
    console.log("Superadmin seeded");

    // Seed admin tanpa agent
    await User.create({
      email: "admin@example.com",
      password: adminPassword,
      role: adminRole._id,
      status: true,
    });
    console.log("Admin seeded");

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
