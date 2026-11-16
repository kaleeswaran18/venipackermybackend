const express = require("express");

const router = express.Router();

const {
  createFinishedMaterialProductController,
  getAllFinishedMaterialProductsController,
  getFinishedMaterialProductByIdController,
  updateFinishedMaterialProductController,
  deleteFinishedMaterialProductController,
} = require("./finished-material-product.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validate = require("../../middleware/validation.middleware");

const {
  createFinishedMaterialProductSchema,
  updateFinishedMaterialProductSchema,
} = require("./finished-material-product.validation");

// Get all finished material products
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllFinishedMaterialProductsController
);

// Get finished material product by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getFinishedMaterialProductByIdController
);

// Create finished material product
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validate(createFinishedMaterialProductSchema),
  createFinishedMaterialProductController
);

// Update finished material product
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validate(updateFinishedMaterialProductSchema),
  updateFinishedMaterialProductController
);

// Delete finished material product
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteFinishedMaterialProductController
);

module.exports = router;