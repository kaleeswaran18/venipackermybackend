
const express = require("express");

const router = express.Router();

const {
  createTransaction,
  updateTransaction,
  getAllTransactions,
  getTransactionById,
  deleteTransaction,
} = require("./finance-transaction.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createFinanceTransactionSchema,
  updateFinanceTransactionSchema,
} = require("./finance-transaction.validation");

// Create Manual Transaction
router.post(
  "/",
  authMiddleware,
  validationMiddleware(createFinanceTransactionSchema),
  createTransaction
);

// Get All Transactions
router.get(
  "/",
  authMiddleware,
  getAllTransactions
);

// Get Transaction By ID
router.get(
  "/:id",
  authMiddleware,
  getTransactionById
);

// Update Manual Transaction
router.patch(
  "/:id",
  authMiddleware,
  validationMiddleware(updateFinanceTransactionSchema),
  updateTransaction
);

// Delete Manual Transaction (Soft Delete)
router.delete(
  "/:id",
  authMiddleware,
  deleteTransaction
);

module.exports = router;
