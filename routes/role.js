const express = require("express");
const router = express.Router();
const {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
} = require("../controllers/role");

router.route("/roles").post(createRole); // Create role
router.route("/roles").get(getRoles); // Get all roles
router.route("/roles/:id").get(getRole); // Get specific role
router.route("/roles/:id").patch(updateRole); // Update specific role
router.route("/roles/:id").delete(deleteRole); // Delete role
module.exports = router;
