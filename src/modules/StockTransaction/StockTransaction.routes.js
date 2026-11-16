const express = require("express");

const router = express.Router();

const {
  createStockTransactionController,
  getStockTransactionsController,
  getStockTransactionByIdController,
  updateStockTransactionController,
  deleteStockTransactionController,
} = require("./StockTransaction.controller");


// =========================
// Create Stock Transaction
// =========================

router.post(
  "/",
  createStockTransactionController
);


// =========================
// Get All Stock Transactions
// =========================

router.get(
  "/",
  getStockTransactionsController
);


// =========================
// Get Stock Transaction By ID
// =========================

router.get(
  "/:id",
  getStockTransactionByIdController
);


// =========================
// Update Stock Transaction
// =========================

router.patch(
  "/:id",
  updateStockTransactionController
);


// =========================
// Delete Stock Transaction
// =========================

router.delete(
  "/:id",
  deleteStockTransactionController
);


module.exports = router;