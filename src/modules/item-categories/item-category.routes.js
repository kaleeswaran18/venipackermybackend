const express = require("express");

const router = express.Router();

const {
  createItemCategory,
  getItemCategories,
  getItemCategoryById,
  updateItemCategory,
  deleteItemCategory,
} = require("./item-category.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validate = require("../../middleware/validation.middleware");

const {
  createItemCategorySchema,
  updateItemCategorySchema,
} = require("./item-category.validation");

// Get all categories
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getItemCategories
);

// Get category by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getItemCategoryById
);

// Create category
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validate(createItemCategorySchema),
  createItemCategory
);

// Update category
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validate(updateItemCategorySchema),
  updateItemCategory
);

// Delete category
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteItemCategory
);

module.exports = router;