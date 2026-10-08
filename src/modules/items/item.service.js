const Item = require("./item.model");

// =========================
// CREATE ITEM
// =========================

const createItem = async ({ name, category }) => {
  const existingItem = await Item.findOne({
    name,
    category,
  });

  if (existingItem) {
    throw new Error("Item already exists in this category");
  }

  const item = await Item.create({
    name,
    category,
  });

  return item;
};


// =========================
// GET ALL ITEMS
// =========================

const getAllItems = async () => {
  const items = await Item.find()
    .sort({ category: 1, name: 1 });

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

const updateItem = async (
  itemId,
  { name, category, isActive }
) => {
  const item = await Item.findById(itemId);

  if (!item) {
    throw new Error("Item not found");
  }

  const newName = name ?? item.name;
  const newCategory = category ?? item.category;

  if (
    newName !== item.name ||
    newCategory !== item.category
  ) {
    const existingItem = await Item.findOne({
      name: newName,
      category: newCategory,
      _id: { $ne: itemId },
    });

    if (existingItem) {
      throw new Error(
        "Item already exists in this category"
      );
    }
  }

  item.name = newName;
  item.category = newCategory;

  if (isActive !== undefined) {
    item.isActive = isActive;
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