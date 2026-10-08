const express = require("express");

const router = express.Router();

const {
  createFinishedMaterialStock,
  getAllFinishedMaterialStocks,
  getFinishedMaterialStockById,
  updateFinishedMaterialStock,
  deleteFinishedMaterialStock,
} = require("./finishedMaterialStock.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createFinishedMaterialStockSchema,
  updateFinishedMaterialStockSchema,
} = require("./finishedMaterialStock.validation");

// CREATE STOCK
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(
    createFinishedMaterialStockSchema
  ),
  createFinishedMaterialStock
);

// GET ALL STOCK
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllFinishedMaterialStocks
);

// GET STOCK BY ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getFinishedMaterialStockById
);

// UPDATE STOCK
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(
    updateFinishedMaterialStockSchema
  ),
  updateFinishedMaterialStock
);

// DELETE STOCK
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteFinishedMaterialStock
);

module.exports = router;