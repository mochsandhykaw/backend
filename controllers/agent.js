const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const _ = require("lodash");

const Agent = require("../models/agent");
const AgentDetail = require("../models/agent-detail");
const Country = require("../models/country");
const Role = require("../models/role");
const User = require("../models/user");

const asyncWrapper = require("../middleware/async-wrapper");
const {
  conflict,
  created,
  badRequest,
  selectFields,
  applySort,
  parsePaginationParams,
  buildQuery,
  notFound,
  ok,
} = require("../middleware/response");

// CREATE AGENT
const createAgent = asyncWrapper(async (req, res) => {
  const { agentName, country, agentEmail, agentPhoneNumber } = req.body;

  // 1. Validasi ObjectId untuk country
  if (!mongoose.Types.ObjectId.isValid(country)) {
    return badRequest(res, "Format ID negara tidak valid");
  }

  // 2. Validasi country ada
  const validCountry = await Country.findById(country);
  if (!validCountry) {
    return badRequest(res, "Negara tidak ditemukan");
  }

  // 3. Cek apakah email sudah digunakan di AgentDetail
  const emailExists = await AgentDetail.exists({ agentEmail });
  if (emailExists) {
    return conflict(res, "Email sudah digunakan oleh agent lain");
  }

  // 4. Cek apakah nama agent sudah digunakan
  const nameExists = await Agent.exists({ agentName });
  if (nameExists) {
    return conflict(res, `Agent ${_.capitalize(agentName)} sudah terdaftar`);
  }

  // 5. Cek apakah email sudah digunakan di User
  const userEmailExists = await User.exists({ email: agentEmail });
  if (userEmailExists) {
    return conflict(res, "Email sudah terdaftar sebagai user");
  }

  // 6. Cari role dengan nama 'agent'
  const role = await Role.findOne({ roleName: "agent" });
  if (!role) {
    return badRequest(res, "Role 'agent' tidak ditemukan di sistem");
  }

  // 7. Buat detail agent
  const detail = await AgentDetail.create({
    agentEmail,
    agentPhoneNumber,
  });

  // 8. Buat agent
  const agent = await Agent.create({
    agentName,
    country,
    agentDetail: detail._id,
  });

  // 9. Buat user dengan password default
  const defaultPassword = process.env.AGENT_DEFAULT_PASSWORD;
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const user = await User.create({
    email: agentEmail,
    password: hashedPassword,
    role: role._id,
    agent: agent._id,
    status: true, // aktif
  });

  // 10. Populate agent sebelum dikirim ke frontend
  const populatedAgent = await Agent.findById(agent._id)
    .populate("country", "_id nameId nameEn")
    .populate("agentDetail");

  // 11. Kirim response berhasil
  return created(
    res,
    populatedAgent,
    `Agent ${agent.agentName} berhasil dibuat beserta akun user (${user.email})`
  );
});

// GET ALL AGENTS
const getAgents = asyncWrapper(async (req, res) => {
  const { agent, sort, fields, startDate, endDate } = req.query;
  const queryObject = {};

  if (agent) {
    queryObject.agentName = { $regex: new RegExp(agent, "i") };
  }

  buildQuery(queryObject, startDate, endDate);

  let result = Agent.find(queryObject)
    .populate("country", "_id nameId nameEn")
    .populate("agentDetail");

  result = applySort(result, sort);
  result = selectFields(result, fields);

  const pageParams = await parsePaginationParams(req.query);
  result = result.skip(pageParams.skip).limit(pageParams.limit);

  const data = await result;

  return ok(res, `Retrieved ${data.length} agent(s)`, data);
});

// GET SINGLE AGENT (by id or agentName)
const getAgent = asyncWrapper(async (req, res) => {
  const { id, agent } = req.query;
  let data;

  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return badRequest(res, "Invalid ID format");
    }
    data = await Agent.findById(id)
      .populate("country", "_id nameId nameEn")
      .populate("agentDetail");
  } else if (agent) {
    data = await Agent.findOne({ agentName: agent })
      .populate("country", "_id nameId nameEn")
      .populate("agentDetail");
  } else {
    return badRequest(res, "Please provide either agent ID or agent name");
  }

  if (!data) {
    return notFound(res, "Agent not found");
  }

  return ok(res, `Found agent ${data.agentName}`, data);
});

// UPDATE AGENT
const updateAgent = asyncWrapper(async (req, res) => {
  const { id } = req.query;
  const { agentName, country, agentEmail, agentPhoneNumber } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return badRequest(res, "Invalid agent ID");
  }

  const agent = await Agent.findById(id);
  if (!agent) {
    return notFound(res, "Agent not found");
  }

  // Cek nama duplikat (kecuali dirinya sendiri)
  if (agentName) {
    const duplicateName = await Agent.findOne({
      agentName,
      _id: { $ne: id },
    });
    if (duplicateName) {
      return conflict(res, `Agent name "${agentName}" already exists`);
    }
  }

  // Cek email duplikat
  if (agentEmail) {
    const duplicateEmail = await AgentDetail.findOne({
      agentEmail,
      _id: { $ne: agent.agentDetail },
    });
    if (duplicateEmail) {
      return conflict(res, `Email "${agentEmail}" already exists`);
    }
  }

  // Cek validasi country
  if (country && !mongoose.Types.ObjectId.isValid(country)) {
    return badRequest(res, "Invalid country ID");
  }

  if (country) {
    const validCountry = await Country.findById(country);
    if (!validCountry) {
      return badRequest(res, "Invalid country ID");
    }
  }

  // Update agent
  const updatedAgent = await Agent.findByIdAndUpdate(
    id,
    {
      ...(agentName && { agentName }),
      ...(country && { country }),
    },
    { new: true }
  );

  // Update agent detail
  await AgentDetail.findByIdAndUpdate(
    agent.agentDetail,
    {
      ...(agentEmail && { agentEmail }),
      ...(agentPhoneNumber && { agentPhoneNumber }),
    },
    { new: true }
  );

  const data = await updatedAgent.populate("country").populate("agentDetail");
  return ok(res, "Agent updated successfully", data);
});

// DELETE AGENT
const deleteAgent = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return badRequest(res, "Invalid agent ID");
  }

  const agent = await Agent.findById(id);
  if (!agent) {
    return notFound(res, "Agent not found");
  }

  // Hapus detail-nya dulu
  await AgentDetail.findByIdAndDelete(agent.agentDetail);

  // Hapus user yang terkait dengan agent
  await User.findOneAndDelete({ agent: agent._id });

  // Hapus agent
  await Agent.findByIdAndDelete(id);

  return ok(res, "Agent deleted successfully");
});

module.exports = {
  createAgent,
  getAgents,
  getAgent,
  updateAgent,
  deleteAgent,
};
