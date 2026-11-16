const express = require("express");

const router = express.Router();

const {
  createOverallStockController,
  getAllOverallStocksController,
  getOverallStockByIdController,
  updateOverallStockController,
  deleteOverallStockController,
} = require("./finished-material-product-stock.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validate = require("../../middleware/validation.middleware");

const {
  createOverallStockSchema,
  updateOverallStockSchema,
} = require("./finished-material-product-stock.validation");

// Get all overall stocks
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllOverallStocksController
);

// Get overall stock by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getOverallStockByIdController
);

// Create overall stock
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validate(createOverallStockSchema),
  createOverallStockController
);

// Update overall stock
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validate(updateOverallStockSchema),
  updateOverallStockController
);

// Delete overall stock
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteOverallStockController
);

module.exports = router;