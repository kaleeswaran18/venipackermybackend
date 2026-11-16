const express = require("express");

const router = express.Router();

const {
  createTaxController,
  getTaxTransactionsController,
  getTaxSummaryController,
  getTaxTransactionByIdController,
  updateTaxController,
  deleteTaxController,
} = require("./tax.controller");

// =========================
// Create Tax
// =========================

router.post(
  "/",
  createTaxController
);

// =========================
// Get Tax Summary
// =========================

router.get(
  "/summary",
  getTaxSummaryController
);

// =========================
// Get All Tax Transactions
// =========================

router.get(
  "/",
  getTaxTransactionsController
);

// =========================
// Get Tax By ID
// =========================

router.get(
  "/:id",
  getTaxTransactionByIdController
);

// =========================
// Update Tax
// =========================

router.patch(
  "/:id",
  updateTaxController
);

// =========================
// Delete Tax
// =========================

router.delete(
  "/:id",
  deleteTaxController
);

module.exports = router;