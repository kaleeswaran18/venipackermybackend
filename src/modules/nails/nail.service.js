const Nail = require("./nail.model");

// =========================
// CREATE NAIL
// =========================

const createNail = async ({ name }) => {
  const existingNail = await Nail.findOne({
    name,
  });

  if (existingNail) {
    throw new Error("Nail already exists");
  }

  const nail = await Nail.create({
    name,
  });

  return nail;
};


// =========================
// GET ALL NAILS
// =========================

const getAllNails = async () => {
  const nails = await Nail.find()
    .sort({ name: 1 });

  return nails;
};


// =========================
// GET NAIL BY ID
// =========================

const getNailById = async (nailId) => {
  const nail = await Nail.findById(nailId);

  if (!nail) {
    throw new Error("Nail not found");
  }

  return nail;
};


// =========================
// UPDATE NAIL
// =========================

const updateNail = async (
  nailId,
  { name, isActive }
) => {
  const nail = await Nail.findById(nailId);

  if (!nail) {
    throw new Error("Nail not found");
  }

  if (name && name !== nail.name) {
    const existingNail = await Nail.findOne({
      name,
      _id: { $ne: nailId },
    });

    if (existingNail) {
      throw new Error("Nail already exists");
    }

    nail.name = name;
  }

  if (isActive !== undefined) {
    nail.isActive = isActive;
  }

  await nail.save();

  return nail;
};


// =========================
// DELETE NAIL
// =========================

const deleteNail = async (nailId) => {
  const nail = await Nail.findById(nailId);

  if (!nail) {
    throw new Error("Nail not found");
  }

  await Nail.findByIdAndDelete(nailId);

  return {
    id: nail._id,
    message: "Nail deleted successfully",
  };
};


module.exports = {
  createNail,
  getAllNails,
  getNailById,
  updateNail,
  deleteNail,
};