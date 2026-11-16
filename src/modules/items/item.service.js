const Item = require("./item.model");

// =========================
// CREATE ITEM
// =========================

const createItem = async ({ name }) => {
  const existingItem = await Item.findOne({
    name,
  });

  if (existingItem) {
    throw new Error("Item already exists");
  }

  const item = await Item.create({
    name,
  });

  return item;
};


// =========================
// GET ALL ITEMS
// =========================

const getAllItems = async () => {
  const items = await Item.find()
    .sort({ name: 1 });

  return items;
};


// =========================
// GET ITEM BY ID
// =========================

const getItemById = async (itemId) => {
  const item = await Item.findById(itemId);

  if (!item) {
    throw new Error("Item not found");
  }

  return item;
};


// =========================
// UPDATE ITEM
// =========================

const updateItem = async (itemId, { name }) => {
  const item = await Item.findById(itemId);

  if (!item) {
    throw new Error("Item not found");
  }

  if (name !== undefined && name !== item.name) {
    const existingItem = await Item.findOne({
      name,
      _id: { $ne: itemId },
    });

    if (existingItem) {
      throw new Error("Item already exists");
    }

    item.name = name;
  }

  await item.save();

  return item;
};


// =========================
// DELETE ITEM
// =========================

const deleteItem = async (itemId) => {
  const item = await Item.findById(itemId);

  if (!item) {
    throw new Error("Item not found");
  }

  await Item.findByIdAndDelete(itemId);

  return {
    id: item._id,
    message: "Item deleted successfully",
  };
};


module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
};