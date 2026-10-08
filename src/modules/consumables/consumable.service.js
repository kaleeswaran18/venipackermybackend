const Consumable = require("./consumable.model");

// CREATE CONSUMABLE
const createConsumable = async ({ name }) => {
  const existingConsumable = await Consumable.findOne({ name });

  if (existingConsumable) {
    throw new Error("Consumable already exists");
  }

  const consumable = await Consumable.create({
    name,
  });

  return consumable;
};


// GET ALL CONSUMABLES
const getAllConsumables = async () => {
  const consumables = await Consumable.find()
    .sort({ name: 1 });

  return consumables;
};


// GET CONSUMABLE BY ID
const getConsumableById = async (consumableId) => {
  const consumable = await Consumable.findById(
    consumableId
  );

  if (!consumable) {
    throw new Error("Consumable not found");
  }

  return consumable;
};


// UPDATE CONSUMABLE
const updateConsumable = async (
  consumableId,
  { name, isActive }
) => {
  const consumable = await Consumable.findById(
    consumableId
  );

  if (!consumable) {
    throw new Error("Consumable not found");
  }

  if (name && name !== consumable.name) {
    const existingConsumable =
      await Consumable.findOne({
        name,
        _id: { $ne: consumableId },
      });

    if (existingConsumable) {
      throw new Error("Consumable already exists");
    }

    consumable.name = name;
  }

  if (isActive !== undefined) {
    consumable.isActive = isActive;
  }

  await consumable.save();

  return consumable;
};


// DELETE CONSUMABLE
const deleteConsumable = async (consumableId) => {
  const consumable = await Consumable.findById(
    consumableId
  );

  if (!consumable) {
    throw new Error("Consumable not found");
  }

  await Consumable.findByIdAndDelete(consumableId);

  return {
    id: consumable._id,
    message: "Consumable deleted successfully",
  };
};


module.exports = {
  createConsumable,
  getAllConsumables,
  getConsumableById,
  updateConsumable,
  deleteConsumable,
};