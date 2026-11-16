const express = require("express");

const router = express.Router();

const {
  createPurchaseController,
  getPurchasesController,
  getPurchaseByIdController,
  updatePurchaseController,
  // deletePurchaseController,
} = require("./Purchase.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");

// =========================
// CREATE PURCHASE
// Admin Only
// =========================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createPurchaseController
);

// =========================
// GET ALL PURCHASES
// Admin + Owner
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getPurchasesController
);

// =========================
// GET PURCHASE BY ID
// Admin + Owner
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getPurchaseByIdController
);

// =========================
// UPDATE PURCHASE
// Admin Only
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updatePurchaseController
);

// =========================
// DELETE PURCHASE
// Admin Only
// =========================

// router.delete(
//   "/:id",
//   authMiddleware,
//   roleMiddleware("admin"),
//   deletePurchaseController
// );

module.exports = router;