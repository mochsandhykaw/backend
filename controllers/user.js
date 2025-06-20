const User = require("../models/user");
const Role = require("../models/role");
const Agent = require("../models/agent");
const asyncWrapper = require("../middleware/async-wrapper");
const {
  created,
  ok,
  notFound,
  conflict,
  badRequest,
} = require("../middleware/response");
const {
  parsePaginationParams,
  selectFields,
  applySort,
  buildQuery,
} = require("../middleware/response");
const _ = require("lodash");
const { hashPassword } = require("../middleware/hash-password");

// CREATE USER
const createUser = asyncWrapper(async (req, res) => {
  let { email, password, role, agent, status } = req.body;

  const emailExist = await User.exists({ email });
  if (emailExist) {
    return conflict(res, `User with email ${email} already exists`);
  }

  const roleExist = await Role.findById(role);
  if (!roleExist) {
    return notFound(res, `Role with ID ${role} not found`);
  }

  if (agent) {
    const agentExist = await Agent.findById(agent);
    if (!agentExist) {
      return notFound(res, `Agent with ID ${agent} not found`);
    }
  }

  const hashedPassword = await hashPassword(password, 10);

  const newUser = await User.create({
    email,
    password: hashedPassword,
    role,
    agent,
    status,
  });

  return created(res, newUser, `User with email ${email} created`);
});

// GET ALL USERS
const getUsers = asyncWrapper(async (req, res) => {
  const { sort, fields, start_date, end_date } = req.query;
  const queryObject = {};

  buildQuery(queryObject, start_date, end_date);

  let result = User.find(queryObject)
    .populate("role", "_id roleName")
    .populate("agent", "_id agentName");

  result = applySort(result, sort);
  result = selectFields(result, fields);

  const pageParams = await parsePaginationParams(req.query);
  result = result.skip(pageParams.skip).limit(pageParams.limit);

  const data = await result;

  return ok(res, `Retrieved ${data.length} user(s)`, data);
});

// GET SINGLE USER
const getUser = asyncWrapper(async (req, res) => {
  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return badRequest(res, "Invalid user ID");
  }

  const user = await User.findById(id)
    .populate("role", "_id name")
    .populate("agent", "_id agentName");

  if (!user) {
    return notFound(res, "User not found");
  }

  return ok(res, `Retrieved user ${user.email}`, user);
});

// UPDATE USER
const updateUser = asyncWrapper(async (req, res) => {
  const { id } = req.query;
  let { email, password, role, agent, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return badRequest(res, "Invalid user ID");
  }

  const user = await User.findById(id);
  if (!user) {
    return notFound(res, "User not found");
  }

  // Cek email unik kecuali user sendiri
  if (email && email !== user.email) {
    const emailExist = await User.findOne({ email, _id: { $ne: id } });
    if (emailExist) {
      return conflict(res, `Email ${email} already exists`);
    }
  }

  if (role && !(await Role.findById(role))) {
    return notFound(res, `Role with ID ${role} not found`);
  }

  if (agent && !(await Agent.findById(agent))) {
    return notFound(res, `Agent with ID ${agent} not found`);
  }

  const updatePayload = {
    ...(email && { email }),
    ...(role && { role }),
    ...(agent && { agent }),
    ...(typeof status === "boolean" && { status }),
  };

  if (password) {
    updatePayload.password = await hashPassword(password, 10);
  }

  const updated = await User.findByIdAndUpdate(id, updatePayload, {
    new: true,
  })
    .populate("role", "_id name")
    .populate("agent", "_id agentName");

  return ok(res, `User updated successfully`, updated);
});

const updateUserStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const user = await User.findByIdAndUpdate(id, { status }, { new: true });

  if (!user) {
    return notFound(res, "User not found");
  }

  return ok(res, `Status user ${user.email} berhasil diubah`, user);
});

// DELETE USER
const deleteUser = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return badRequest(res, "Invalid user ID");
  }

  const user = await User.findById(id);
  if (!user) {
    return notFound(res, "User not found");
  }

  await User.findByIdAndDelete(id);

  return ok(res, `User ${user.email} deleted`);
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserStatus,
};
