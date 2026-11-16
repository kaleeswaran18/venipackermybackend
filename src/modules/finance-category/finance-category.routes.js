const express = require("express");

const router = express.Router();

const {
  createFinanceCategory,
  getAllFinanceCategories,
  getFinanceCategoryById,
  updateFinanceCategory,
  deleteFinanceCategory,
} = require("./finance-category.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createFinanceCategorySchema,
  updateFinanceCategorySchema,
} = require("./finance-category.validation");

// =========================
// CREATE FINANCE CATEGORY
// =========================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(createFinanceCategorySchema),
  createFinanceCategory
);

// =========================
// GET ALL FINANCE CATEGORIES
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllFinanceCategories
);

// =========================
// GET FINANCE CATEGORY BY ID
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getFinanceCategoryById
);

// =========================
// UPDATE FINANCE CATEGORY
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(updateFinanceCategorySchema),
  updateFinanceCategory
);

// =========================
// DELETE FINANCE CATEGORY
// =========================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteFinanceCategory
);

module.exports = router;