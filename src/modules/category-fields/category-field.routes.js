const express = require("express");

const router = express.Router();

const {
  createCategoryFieldController,
  getAllCategoryFieldsController,
  getCategoryFieldByIdController,
  updateCategoryFieldController,
  deleteCategoryFieldController,
} = require("./category-field.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validate = require("../../middleware/validation.middleware");

const {
  createCategoryFieldSchema,
  updateCategoryFieldSchema,
} = require("./category-field.validation");

// Get all category fields
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllCategoryFieldsController
);

// Get category field by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getCategoryFieldByIdController
);

// Create category field
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validate(createCategoryFieldSchema),
  createCategoryFieldController
);

// Update category field
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validate(updateCategoryFieldSchema),
  updateCategoryFieldController
);

// Delete category field
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCategoryFieldController
);

module.exports = router;