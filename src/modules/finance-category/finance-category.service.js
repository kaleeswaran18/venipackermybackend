const FinanceCategory = require("./finance-category.model");

// =========================
// CREATE FINANCE CATEGORY
// =========================

const createFinanceCategory = async (data) => {
  const {
    name,
    type,
    description,
  } = data;

  const financeCategory = await FinanceCategory.create({
    name,
    type,
    description,
  });

  return financeCategory;
};

// =========================
// GET ALL FINANCE CATEGORIES
// =========================

const getAllFinanceCategories = async () => {
  return await FinanceCategory.find()
    .sort({
      createdAt: -1,
    });
};

// =========================
// GET FINANCE CATEGORY BY ID
// =========================

const getFinanceCategoryById = async (
  categoryId
) => {
  const financeCategory =
    await FinanceCategory.findById(categoryId);

  if (!financeCategory) {
    throw new Error("Finance category not found");
  }

  return financeCategory;
};

// =========================
// UPDATE FINANCE CATEGORY
// =========================

const updateFinanceCategory = async (
  categoryId,
  data
) => {
  const financeCategory =
    await FinanceCategory.findById(categoryId);

  if (!financeCategory) {
    throw new Error("Finance category not found");
  }

  if (data.name !== undefined) {
    financeCategory.name = data.name;
  }

  if (data.type !== undefined) {
    financeCategory.type = data.type;
  }

  if (data.description !== undefined) {
    financeCategory.description = data.description;
  }

  await financeCategory.save();

  return financeCategory;
};

// =========================
// DELETE FINANCE CATEGORY
// =========================

const deleteFinanceCategory = async (
  categoryId
) => {
  const financeCategory =
    await FinanceCategory.findById(categoryId);

  if (!financeCategory) {
    throw new Error("Finance category not found");
  }

  await FinanceCategory.findByIdAndDelete(
    categoryId
  );

  return {
    id: financeCategory._id,
    message: "Finance category deleted successfully",
  };
};

module.exports = {
  createFinanceCategory,
  getAllFinanceCategories,
  getFinanceCategoryById,
  updateFinanceCategory,
  deleteFinanceCategory,
};