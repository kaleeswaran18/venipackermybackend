
const express = require("express");
const router = express.Router();

const bulkPaymentController = require(
  "./bulkPayment.controller"
);

// உங்கள் project-ல் பயன்படுத்தும் authentication middleware path-ஐ
// அதற்கேற்ப மாற்றிக்கொள்ளவும்.
const authMiddleware = require("../../middleware/auth.middleware");

// =========================
// BULK PAYMENT ROUTES
// =========================

// Get Company Pending Orders
router.get(
  "/pending-orders/:companyId",
  authMiddleware,
  bulkPaymentController.getPendingOrders
);

// Create Bulk Payment
router.post(
  "/",
  authMiddleware,
  bulkPaymentController.createBulkPayment
);

// Get All Bulk Payments
router.get(
  "/",
  authMiddleware,
  bulkPaymentController.getAllBulkPayments
);

// Get Bulk Payment By ID
router.get(
  "/:id",
  authMiddleware,
  bulkPaymentController.getBulkPaymentById
);

// Update Bulk Payment
router.patch(
  "/:id",
  authMiddleware,
  bulkPaymentController.updateBulkPayment
);

module.exports = router;
