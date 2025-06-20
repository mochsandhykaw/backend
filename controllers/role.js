const schema = require("../models/role");
const asyncWrapper = require("../middleware/async-wrapper");
const {
  created,
  conflict,
  ok,
  selectFields,
  applySort,
  parsePaginationParams,
  buildQuery,
  notFound,
} = require("../middleware/response");
const _ = require("lodash");
const mongoose = require("mongoose");

const createRole = asyncWrapper(async (req, res) => {
  let roleName = req.body.roleName?.toLowerCase();

  if (!roleName) {
    return conflict(res, "roleName is required");
  }

  const roleExist = await schema.exists({ roleName });
  if (roleExist) {
    return conflict(res, `${_.capitalize(roleName)} role already exists`);
  }

  const data = await schema.create({ ...req.body, roleName });
  created(res, data, `Role ${data.roleName} is created`);
});

const getRoles = asyncWrapper(async (req, res) => {
  const { role, sort, fields, start_date, end_date } = req.query;
  const queryObject = {};

  if (role) {
    queryObject.roleName = role;
  }

  buildQuery(queryObject, start_date, end_date);

  let result = schema.find(queryObject);

  result = applySort(result, sort);
  result = selectFields(result, fields);

  const pageParams = await parsePaginationParams(req.query);
  result = result.skip(pageParams.skip).limit(pageParams.limit);

  const data = await result;

  if (!data.length) {
    return notFound(res, "No roles found");
  }

  return ok(res, `Retrieved ${data.length} role(s)`, data);
});

const getRole = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return notFound(res, "Invalid role ID");
  }

  const data = await schema.findById(id);

  if (!data) {
    return notFound(res, "Role not found");
  }

  return ok(res, `Success fetching role: ${data.roleName}`, data);
});

const updateRole = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  let { roleName } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return notFound(res, "Invalid role ID");
  }

  const updateObject = {};

  if (roleName) {
    roleName = roleName.toLowerCase();

    const existingRole = await schema.findOne({ roleName });

    if (existingRole && existingRole._id.toString() !== id) {
      return conflict(res, `Role ${roleName} already exists`);
    }

    updateObject.roleName = roleName;
  }

  const updatedRole = await schema.findByIdAndUpdate(id, updateObject, {
    new: true,
  });

  if (!updatedRole) {
    return notFound(res, "Role not found");
  }

  return ok(res, "Role updated successfully", updatedRole);
});

const deleteRole = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const deletedRole = await schema.findByIdAndDelete(id);
  if (!deletedRole) {
    return notFound(res, `Role not found`);
  }
  return ok(res, `Role ${deletedRole.roleName} berhasil dihapus`, deletedRole);
});

module.exports = {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
};
