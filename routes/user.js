const express = require("express");
const router = express.Router();
const {
  createUser,
  getUsers,
  getUser,
  updateUserStatus,
} = require("../controllers/user");

router.route("/user/create").post(createUser);
router.route("/users").get(getUsers);
router.route("/user").get(getUser);
router.route("/user/:id/status").patch(updateUserStatus);

module.exports = router;
