const financeCategoryService = require("./finance-category.service");

// =========================
// CREATE FINANCE CATEGORY
// =========================

const createFinanceCategory = async (req, res, next) => {
  try {
    const financeCategory =
      await financeCategoryService.createFinanceCategory(
        req.body
      );

    res.status(201).json({
      success: true,
      message: "Finance category created successfully",
      data: financeCategory,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// GET ALL FINANCE CATEGORIES
// =========================

const getAllFinanceCategories = async (req, res, next) => {
  try {
    const financeCategories =
      await financeCategoryService.getAllFinanceCategories();

    res.status(200).json({
      success: true,
      message: "Finance categories fetched successfully",
      data: financeCategories,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// GET FINANCE CATEGORY BY ID
// =========================

const getFinanceCategoryById = async (req, res, next) => {
  try {
    const financeCategory =
      await financeCategoryService.getFinanceCategoryById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message: "Finance category fetched successfully",
      data: financeCategory,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// UPDATE FINANCE CATEGORY
// =========================

const updateFinanceCategory = async (req, res, next) => {
  try {
    const financeCategory =
      await financeCategoryService.updateFinanceCategory(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Finance category updated successfully",
      data: financeCategory,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// DELETE FINANCE CATEGORY
// =========================

const deleteFinanceCategory = async (req, res, next) => {
  try {
    const result =
      await financeCategoryService.deleteFinanceCategory(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        id: result.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFinanceCategory,
  getAllFinanceCategories,
  getFinanceCategoryById,
  updateFinanceCategory,
  deleteFinanceCategory,
};