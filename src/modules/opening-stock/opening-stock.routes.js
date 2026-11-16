const express = require("express");

const router = express.Router();

const {
  createOpeningStock,
  getOpeningStocks,
  getOpeningStockById,
  updateOpeningStock,
  deleteOpeningStock,
  updateOpeningStockPiece,
  deleteOpeningStockPiece,
} = require("./opening-stock.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validate = require("../../middleware/validation.middleware");

const {
  createOpeningStockSchema,
  updateOpeningStockSchema,
} = require("./opening-stock.validation");

// ==========================================
// GET ALL OPENING STOCK
// ==========================================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getOpeningStocks
);

// ==========================================
// GET OPENING STOCK BY ID
// ==========================================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getOpeningStockById
);

// ==========================================
// CREATE OPENING STOCK
// ==========================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validate(createOpeningStockSchema),
  createOpeningStock
);

// ==========================================
// UPDATE OPENING STOCK
// Main fields
// ==========================================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validate(updateOpeningStockSchema),
  updateOpeningStock
);

// ==========================================
// UPDATE INDIVIDUAL PIECE
// ==========================================

router.patch(
  "/:openingStockId/pieces/:pieceId",
  authMiddleware,
  roleMiddleware("admin"),
  updateOpeningStockPiece
);

// ==========================================
// DELETE OPENING STOCK
// Complete document
// ==========================================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteOpeningStock
);

// ==========================================
// DELETE INDIVIDUAL PIECE
// ==========================================

router.delete(
  "/:openingStockId/pieces/:pieceId",
  authMiddleware,
  roleMiddleware("admin"),
  deleteOpeningStockPiece
);

module.exports = router;