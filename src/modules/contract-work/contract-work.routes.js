
const express = require("express");
const router = express.Router();

const contractWorkController = require("./contract-work.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

// =========================
// CREATE CONTRACT WORK
// Admin Only
// =========================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  contractWorkController.createContractWork
);

// =========================
// GET ALL CONTRACT WORKS
// Admin + Owner
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  contractWorkController.getAllContractWorks
);

// =========================
// GET CONTRACT WORK BY ID
// Admin + Owner
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  contractWorkController.getContractWorkById
);

// =========================
// UPDATE CONTRACT WORK
// Admin Only
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  contractWorkController.updateContractWork
);

// =========================
// DELETE CONTRACT WORK
// Admin Only
// =========================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  contractWorkController.deleteContractWork
);

// =========================
// ADD PAYMENT
// Admin Only
// =========================

router.post(
  "/:id/payments",
  authMiddleware,
  roleMiddleware("admin"),
  contractWorkController.addPayment
);

// =========================
// UPDATE PAYMENT
// Admin Only
// =========================

router.patch(
  "/:id/payments/:paymentId",
  authMiddleware,
  roleMiddleware("admin"),
  contractWorkController.updatePayment
);

module.exports = router;
