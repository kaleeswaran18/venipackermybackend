const ItemCategory = require("./item-category.model");

const createItemCategory = async (data) => {
  const existingCategory = await ItemCategory.findOne({
    name: data.name,
  });

  if (existingCategory) {
    const error = new Error("Item category already exists");
    error.statusCode = 409;
    throw error;
  }

  return await ItemCategory.create({
    name: data.name,
  });
};

const getItemCategories = async () => {
  return await ItemCategory.find()
    .sort({ createdAt: -1 });
};

const getItemCategoryById = async (id) => {
  const category = await ItemCategory.findById(id);

  if (!category) {
    const error = new Error("Item category not found");
    error.statusCode = 404;
    throw error;
  }

  return category;
};

const updateItemCategory = async (id, data) => {
  const category = await ItemCategory.findById(id);

  if (!category) {
    const error = new Error("Item category not found");
    error.statusCode = 404;
    throw error;
  }

  if (data.name) {
    const existingCategory = await ItemCategory.findOne({
      name: data.name,
      _id: { $ne: id },
    });

    if (existingCategory) {
      const error = new Error("Item category already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(category, data);

  return await category.save();
};

const deleteItemCategory = async (id) => {
  const category = await ItemCategory.findById(id);

  if (!category) {
    const error = new Error("Item category not found");
    error.statusCode = 404;
    throw error;
  }

  await category.deleteOne();

  return {
    message: "Item category deleted successfully",
  };
};

module.exports = {
  createItemCategory,
  getItemCategories,
  getItemCategoryById,
  updateItemCategory,
  deleteItemCategory,
};